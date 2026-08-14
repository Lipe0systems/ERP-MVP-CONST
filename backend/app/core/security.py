"""
Validação de tokens de autenticação emitidos pelo Supabase Auth.
Camada: Core (infraestrutura transversal)

Em vez de decodificar e validar o JWT localmente com uma chave (abordagem
HS256/ES256 que depende de manter uma chave de assinatura sincronizada — e
que na prática se mostrou sensível a erros de configuração na tela de JWT
Signing Keys do Supabase), o token é validado diretamente contra o servidor
de autenticação do Supabase (GET /auth/v1/user). É a abordagem que a própria
documentação do Supabase recomenda para quem não quer lidar com
gerenciamento de chaves de assinatura, e funciona com qualquer algoritmo que
o Supabase decida usar (HS256, ES256, RS256...) sem exigir nenhuma mudança
neste arquivo.

SEGURANÇA — FONTE DA VERDADE PARA empresa_id E papel (correção CRITICAL):
O token do Supabase apenas confirma QUEM é o usuário (seu id/email). Ele
NUNCA é usado para decidir a QUAL EMPRESA esse usuário pertence ou QUAL
PAPEL ele tem — esses dois dados vêm exclusivamente de uma consulta à
tabela `usuarios` no nosso próprio banco, feita a cada requisição.

Isso é proposital: o campo `user_metadata` do Supabase Auth pode ser
alterado pelo próprio usuário autenticado a qualquer momento, através da
função padrão `supabase.auth.updateUser({ data: {...} })` — não requer
papel de admin nem a service_role key, é comportamento documentado do
Supabase. Se `empresa_id`/`papel` fossem lidos de lá, qualquer usuário
logado poderia se atribuir a empresa ou o papel que quisesse e acessar
dados de outros clientes do SaaS. A tabela `usuarios` só é gravada pelo
backend (com a service_role key), nunca diretamente pelo cliente — por
isso é a única fonte confiável.
"""
from typing import Any
from uuid import UUID
import logging

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.infrastructure.database.session import get_db

logger = logging.getLogger("uvicorn.error")
settings = get_settings()


class Http401Bearer(HTTPBearer):
    """
    HTTPBearer do FastAPI retorna 403 (Forbidden) quando o header Authorization
    está ausente, o que é semanticamente incorreto — a ausência de credenciais
    deve resultar em 401 (Unauthorized). Esta subclasse corrige o status code.
    """

    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials:
        try:
            return await super().__call__(request)
        except HTTPException as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=exc.detail or "Não autenticado",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc


bearer_scheme = Http401Bearer(auto_error=True)


class CurrentUser:
    def __init__(
        self,
        id: str,
        email: str | None,
        empresa_id: str | None,
        papel: str,
        raw: dict[str, Any],
    ):
        self.id = id
        self.email = email
        self.empresa_id = empresa_id
        self.papel = papel
        self.raw = raw


def _verificar_token_no_supabase(token: str) -> dict[str, Any]:
    """
    Pede para o próprio Supabase Auth confirmar que o token é válido e
    devolver os dados do usuário (id/email), em vez de validar a assinatura
    localmente. Síncrona de propósito: o FastAPI já executa dependências
    síncronas numa threadpool automaticamente, e essa é a forma que se
    confirmou estável em produção (logs do Supabase confirmam as chamadas
    chegando com sucesso).

    NOTA: este passo autentica (confirma identidade). A autorização
    (empresa/papel) acontece depois, em get_current_user, consultando o
    nosso próprio banco — nunca a partir dos metadados devolvidos aqui.
    """
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.SUPABASE_ANON_KEY,
                },
            )
    except Exception as exc:  # noqa: BLE001 — qualquer falha vira 401 controlado,
        # nunca deixamos uma exceção crua escapar da dependency (isso poderia
        # gerar uma resposta sem os cabeçalhos de CORS, que o navegador então
        # reporta como "bloqueado por CORS" em vez do erro real).
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não foi possível validar o token de autenticação.",
        ) from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )

    try:
        return response.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Resposta inesperada do servidor de autenticação.",
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    payload = _verificar_token_no_supabase(credentials.credentials)
    auth_user_id = payload["id"]

    # Fonte da verdade: tabela `usuarios`, nunca o token/user_metadata.
    # Import local para evitar import circular (infrastructure -> core -> infrastructure).
    from app.infrastructure.database.models.usuario import UsuarioModel

    usuario = db.query(UsuarioModel).filter(UsuarioModel.id == auth_user_id).first()

    if usuario is None:
        # Conta autenticada no Supabase mas ainda sem vínculo com nenhuma
        # empresa neste sistema (ex.: convite ainda não foi finalizado do
        # lado do backend). Falha de forma clara em vez de confiar em
        # metadados que o próprio usuário poderia ter forjado.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário autenticado, mas sem vínculo com nenhuma empresa neste sistema.",
        )

    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este usuário foi desativado.",
        )

    empresa_id = str(usuario.empresa_id)

    # Defesa em profundidade para quando/se RLS (Row Level Security) for
    # habilitado no banco: define a empresa da sessão Postgres atual, para
    # que as policies possam usá-la independentemente de qualquer filtro
    # esquecido no código Python. Ver docs/schema_rls.sql.
    #
    # Usa set_config(...) e NÃO `SET LOCAL app.x = :param`: o comando SET do
    # Postgres não aceita parâmetros vinculados (bind params) — só a função
    # set_config aceita. O terceiro argumento `true` faz o valor valer apenas
    # na transação atual, equivalente a SET LOCAL.
    #
    # Como consequência do escopo de transação: o valor some após um
    # `db.commit()` no meio da requisição. Se isso acontecer com RLS ativo,
    # as queries seguintes ficam sem empresa definida e a policy nega tudo
    # (modo seguro: retorna vazio em vez de vazar dados de outra empresa).
    try:
        db.execute(
            text("SELECT set_config('app.current_empresa_id', :eid, true)"),
            {"eid": empresa_id},
        )
    except Exception:  # noqa: BLE001 — não derruba a autenticação, mas registra:
        # se isto falhar com RLS habilitado, todas as queries retornarão vazio,
        # e sem este log a causa seria praticamente impossível de descobrir.
        logger.exception(
            "Falha ao definir app.current_empresa_id na sessão do banco "
            "(usuário %s, empresa %s). Com RLS habilitado, as consultas "
            "desta requisição retornarão vazio.",
            usuario.id,
            empresa_id,
        )

    return CurrentUser(
        id=str(usuario.id),
        email=usuario.email,
        empresa_id=empresa_id,
        papel=usuario.papel,
        raw=payload,
    )


class IdentidadeAutenticada:
    """
    Apenas quem é o usuário (confirmado pelo Supabase Auth), sem nenhum
    vínculo com empresa. Usado só pelo administrador do SaaS, que é dono da
    plataforma e não pertence a nenhuma empresa cliente.
    """

    def __init__(self, id: str, email: str | None):
        self.id = id
        self.email = email


def get_identidade_autenticada(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> IdentidadeAutenticada:
    """
    Valida o token e devolve id/email, SEM exigir que o usuário exista na
    tabela `usuarios`.

    Existe separadamente de get_current_user porque o administrador do SaaS
    não pertence a nenhuma empresa — não tem (nem deve ter) linha em
    `usuarios`. Se ele passasse por get_current_user, receberia 403 e ficaria
    impedido de criar novas empresas, travando o onboarding da plataforma.

    NÃO use esta dependency em endpoints de negócio: ela não estabelece
    empresa nem papel, portanto não oferece isolamento multi-tenant.
    """
    payload = _verificar_token_no_supabase(credentials.credentials)
    return IdentidadeAutenticada(id=payload["id"], email=payload.get("email"))


def get_empresa_id(current_user: CurrentUser = Depends(get_current_user)) -> UUID:
    """
    Dependency compartilhada por todos os módulos (Clientes, Obras, ...): garante
    que o usuário autenticado possui uma empresa vinculada e que o valor é um
    UUID válido. O empresa_id já vem validado contra o banco (ver
    get_current_user) — não é mais derivado de dado gravável pelo cliente.
    """
    try:
        return UUID(str(current_user.empresa_id))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identificador de empresa inválido.",
        ) from exc


def exigir_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """
    Dependency reutilizável para qualquer endpoint que só o Administrador da
    empresa deve poder executar (ex.: gestão de usuários, exclusão definitiva
    na Lixeira, exportação de backup completo). Papel vem do banco (fonte da
    verdade), nunca do token.
    """
    if current_user.papel != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem realizar esta ação.",
        )
    return current_user
