"""
Endpoints relacionados ao usuário autenticado.
A autenticação (login/logout/recuperação de senha) é feita pelo Supabase Auth
diretamente no frontend; aqui expomos apenas dados do usuário/empresa atual.
Camada: Presentation.
"""
from fastapi import APIRouter, Depends

from app.core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.get("/me")
def get_me(current_user: CurrentUser = Depends(get_current_user)):
    """Retorna os dados do usuário autenticado (empresa e papel vêm do banco)."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "empresa_id": current_user.empresa_id,
        # Permite ao frontend esconder ações que o backend vai recusar
        # (ex.: apagar definitivo, exportar backup) em vez de deixar o
        # usuário clicar e tomar 403.
        "papel": current_user.papel,
    }
