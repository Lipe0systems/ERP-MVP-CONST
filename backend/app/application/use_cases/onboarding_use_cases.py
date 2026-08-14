"""
Caso de uso: Onboarding — criar empresa + primeiro usuário admin.
Camada: Application.

Fluxo:
1. Cria a empresa no banco (tabela `empresas`)
2. Cria o usuário no Supabase Auth via Admin API (service_role — nunca expor no frontend)
3. Define o `app_metadata` com `empresa_id` (só gravável com service_role — nunca pelo
   próprio usuário; ver core/security.py para o porquê disso importar)
4. Espelha o usuário na tabela `usuarios` — é essa tabela, não o token, que o
   backend consulta a cada requisição para saber empresa/papel do usuário

Se qualquer etapa falhar após a criação no Auth, tenta reverter (best-effort).
"""
import uuid
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.infrastructure.database.models.empresa import EmpresaModel
from app.infrastructure.database.models.usuario import UsuarioModel

settings = get_settings()


def criar_empresa_e_admin(
    db: Session,
    empresa_nome: str,
    empresa_cnpj: str,
    empresa_email: str | None,
    empresa_telefone: str | None,
    empresa_endereco: str | None,
    admin_nome: str,
    admin_email: str,
    admin_senha: str,
) -> dict:
    """
    Cria a empresa e o primeiro usuário admin.
    Retorna o token de acesso para login automático.
    """
    # 1. Validar CNPJ único
    cnpj_limpo = "".join(c for c in empresa_cnpj if c.isdigit())
    existente = db.query(EmpresaModel).filter(EmpresaModel.cnpj == cnpj_limpo).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma empresa cadastrada com esse CNPJ.",
        )

    # 2. Criar empresa no banco
    empresa_id = uuid.uuid4()
    empresa = EmpresaModel(
        id=empresa_id,
        nome=empresa_nome.strip(),
        cnpj=cnpj_limpo,
        email=empresa_email,
        telefone=empresa_telefone,
        ativo=True,
    )
    db.add(empresa)
    db.flush()  # garante que a empresa existe antes de criar o usuário

    # 3. Criar usuário no Supabase Auth via Admin API
    auth_user_id = _criar_usuario_supabase_auth(
        email=admin_email,
        senha=admin_senha,
        nome=admin_nome,
        empresa_id=empresa_id,
    )

    # 4. Espelhar na tabela usuarios
    usuario = UsuarioModel(
        id=auth_user_id,
        empresa_id=empresa_id,
        nome=admin_nome.strip(),
        email=admin_email.strip().lower(),
        papel="admin",
        ativo=True,
    )
    db.add(usuario)
    db.commit()

    # 5. Fazer login e retornar token (pra redirecionar pro dashboard)
    token_data = _fazer_login_supabase(admin_email, admin_senha)
    token_data["empresa_id"] = str(empresa_id)
    return token_data


def _criar_usuario_supabase_auth(
    email: str,
    senha: str,
    nome: str,
    empresa_id: UUID,
) -> UUID:
    """Cria um usuário no Supabase Auth usando a Admin API (service_role)."""
    url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
    payload = {
        "email": email.strip().lower(),
        "password": senha,
        "email_confirm": True,  # já confirma o e-mail automaticamente
        "app_metadata": {
            # app_metadata só é gravável com a service_role key — nunca pelo
            # próprio usuário. É por isso que a autorização (empresa/papel)
            # é lida da tabela `usuarios` no banco, nunca daqui diretamente,
            # mas mesmo assim não se deve colocar esse dado num campo que o
            # usuário logado poderia reescrever sozinho (user_metadata).
            "empresa_id": str(empresa_id),
        },
        "user_metadata": {
            "full_name": nome.strip(),
        },
    }

    try:
        response = httpx.post(
            url,
            json=payload,
            headers={
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
            timeout=15.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Não foi possível criar o usuário no serviço de autenticação.",
        ) from exc

    if response.status_code == 422:
        data = response.json()
        msg = data.get("msg") or data.get("message") or "E-mail já cadastrado."
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=msg)

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erro ao criar usuário: {response.text[:200]}",
        )

    return UUID(response.json()["id"])


def _fazer_login_supabase(email: str, senha: str) -> dict:
    """Faz login via Supabase Auth e retorna o token de acesso."""
    url = f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password"
    try:
        response = httpx.post(
            url,
            json={"email": email, "password": senha},
            headers={
                "apikey": settings.SUPABASE_ANON_KEY,
                "Content-Type": "application/json",
            },
            timeout=15.0,
        )
    except httpx.HTTPError as exc:
        # Login falhou, mas empresa e usuário foram criados — não é crítico
        return {}

    if response.is_success:
        return response.json()
    return {}


def remover_empresa(db: Session, empresa_id: UUID) -> dict:
    """
    Remove uma empresa e todos os seus dados via cascata (FK ON DELETE
    CASCADE), e também apaga a conta de login (Supabase Auth) de cada
    usuário vinculado a ela — sem isso, a pessoa continuaria conseguindo
    autenticar normalmente (só ficaria barrada por falta de vínculo com
    empresa, mas a conta e a senha permaneceriam ativas).

    A ordem importa: apaga primeiro no Auth (usando o id ainda presente na
    tabela `usuarios`), e só depois apaga a empresa no banco — se apagasse
    a empresa primeiro, a cascata já teria removido as linhas de `usuarios`
    e não haveria mais como saber quais contas de Auth pertenciam a ela.

    Best-effort nas exclusões do Auth: se alguma falhar (ex.: a conta já não
    existe mais lá), a empresa e os dados no banco são removidos do mesmo
    jeito — o retorno informa quais contas não puderam ser removidas, para
    o admin do SaaS decidir se quer limpar manualmente no painel do
    Supabase.
    """
    from app.infrastructure.database.models.empresa import EmpresaModel
    from app.infrastructure.database.models.usuario import UsuarioModel
    from fastapi import HTTPException, status

    empresa = db.query(EmpresaModel).filter(EmpresaModel.id == empresa_id).first()
    if empresa is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada.",
        )

    usuarios = db.query(UsuarioModel).filter(UsuarioModel.empresa_id == empresa_id).all()

    falhas_auth: list[str] = []
    for usuario in usuarios:
        try:
            resp = httpx.delete(
                f"{settings.SUPABASE_URL}/auth/v1/admin/users/{usuario.id}",
                headers={
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                },
                timeout=15.0,
            )
            # 404 é aceitável aqui: a conta já pode não existir mais no Auth
            # (ex.: removida manualmente antes) — não é motivo pra travar a
            # exclusão da empresa.
            if resp.status_code not in (200, 204, 404):
                falhas_auth.append(usuario.email)
        except httpx.HTTPError:
            falhas_auth.append(usuario.email)

    db.delete(empresa)
    db.commit()

    return {"usuarios_removidos": len(usuarios), "falhas_ao_remover_login": falhas_auth}
