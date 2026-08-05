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
"""
from typing import Any
from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

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
    def __init__(self, id: str, email: str | None, empresa_id: str | None, raw: dict[str, Any]):
        self.id = id
        self.email = email
        self.empresa_id = empresa_id
        self.raw = raw


async def _verificar_token_no_supabase(token: str) -> dict[str, Any]:
    """
    Pede para o próprio Supabase Auth confirmar que o token é válido e
    devolver os dados do usuário, em vez de validar a assinatura localmente.
    Assíncrono de propósito: o dashboard e as telas disparam várias chamadas
    autenticadas em paralelo, e uma chamada de rede síncrona aqui prenderia
    threads do worker (o Render roda com WEB_CONCURRENCY=1), podendo causar
    lentidão ou timeout sob concorrência.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.SUPABASE_ANON_KEY,
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não foi possível validar o token de autenticação.",
        ) from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )

    return response.json()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    payload = await _verificar_token_no_supabase(credentials.credentials)
    user_metadata = payload.get("user_metadata", {}) or {}
    empresa_id = user_metadata.get("empresa_id") or payload.get("app_metadata", {}).get("empresa_id")

    return CurrentUser(
        id=payload["id"],
        email=payload.get("email"),
        empresa_id=empresa_id,
        raw=payload,
    )


def get_empresa_id(current_user: CurrentUser = Depends(get_current_user)) -> UUID:
    """
    Dependency compartilhada por todos os módulos (Clientes, Obras, ...): garante
    que o usuário autenticado possui uma empresa vinculada e que o valor é um
    UUID válido, evitando consultas/gravações com empresa_id nulo ou malformado
    (o que geraria um erro 500 não tratado em vez de uma resposta 400 clara).
    """
    if not current_user.empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário autenticado não possui empresa vinculada.",
        )
    try:
        return UUID(str(current_user.empresa_id))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identificador de empresa inválido no token de autenticação.",
        ) from exc
