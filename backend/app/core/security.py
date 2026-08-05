"""
Validação de tokens JWT emitidos pelo Supabase Auth.
Camada: Core (infraestrutura transversal)
"""
from typing import Any
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

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


def decode_supabase_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError as exc:
        # DIAGNÓSTICO TEMPORÁRIO — remover depois de identificar a causa do 401.
        # Mostra o algoritmo/kid do token recebido (sem verificar assinatura)
        # e a mensagem exata do erro, para aparecer nos logs do Render.
        try:
            header = jwt.get_unverified_header(token)
        except Exception as header_exc:  # noqa: BLE001
            header = {"erro_ao_ler_header": str(header_exc)}
        print(f"[DEBUG-AUTH] header do token recebido: {header}")
        print(f"[DEBUG-AUTH] erro de validação: {exc}")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    payload = decode_supabase_token(credentials.credentials)
    user_metadata = payload.get("user_metadata", {}) or {}
    empresa_id = user_metadata.get("empresa_id") or payload.get("app_metadata", {}).get("empresa_id")

    return CurrentUser(
        id=payload["sub"],
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
