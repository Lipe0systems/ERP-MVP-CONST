"""
Endpoints de onboarding (criar/remover empresa + usuário admin).
Camada: Presentation.

Acesso restrito ao e-mail do administrador do SaaS (SAAS_ADMIN_EMAIL).
Qualquer outro usuário recebe 403, mesmo que esteja autenticado.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.application.use_cases.onboarding_use_cases import criar_empresa_e_admin, remover_empresa
from app.core.security import CurrentUser, get_current_user
from app.infrastructure.database.session import get_db
from app.presentation.schemas.onboarding import OnboardingCreate, OnboardingOut

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

# E-mail do único administrador autorizado a criar/remover empresas.
SAAS_ADMIN_EMAIL = "accuservpn@proton.me"


def _exigir_admin_saas(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Dependency que bloqueia qualquer usuário que não seja o dono do SaaS."""
    if (current_user.email or "").lower() != SAAS_ADMIN_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito ao administrador do sistema.",
        )
    return current_user


@router.post("", response_model=OnboardingOut, status_code=201)
def criar_empresa(
    body: OnboardingCreate,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(_exigir_admin_saas),
):
    resultado = criar_empresa_e_admin(
        db=db,
        empresa_nome=body.empresa_nome,
        empresa_cnpj=body.empresa_cnpj,
        empresa_email=body.empresa_email,
        empresa_telefone=body.empresa_telefone,
        empresa_endereco=body.empresa_endereco,
        admin_nome=body.admin_nome,
        admin_email=body.admin_email,
        admin_senha=body.admin_senha,
    )

    return OnboardingOut(
        mensagem="Empresa e usuário admin criados com sucesso.",
        empresa_id=str(resultado.get("empresa_id", "")),
        access_token=resultado.get("access_token"),
        refresh_token=resultado.get("refresh_token"),
    )


@router.delete("/{empresa_id}", status_code=204)
def deletar_empresa(
    empresa_id: UUID,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(_exigir_admin_saas),
):
    """Remove uma empresa e todos os seus dados (cascata no banco)."""
    remover_empresa(db=db, empresa_id=empresa_id)
