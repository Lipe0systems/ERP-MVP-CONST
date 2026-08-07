"""
Endpoints de onboarding (criar empresa + primeiro usuário admin).
Camada: Presentation.

IMPORTANTE: Este endpoint é protegido — só pode ser chamado por um usuário
autenticado. No fluxo atual, o dono do sistema faz login com sua conta e usa
esta rota para criar empresas/clientes. Isso evita que qualquer pessoa na
internet possa criar contas livremente.
"""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.application.use_cases.onboarding_use_cases import criar_empresa_e_admin
from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.presentation.schemas.onboarding import OnboardingCreate, OnboardingOut

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("", response_model=OnboardingOut, status_code=201)
def criar_empresa(
    body: OnboardingCreate,
    db: Session = Depends(get_db),
    # Exige autenticação — só quem já está logado pode criar novas empresas
    _empresa_id: UUID = Depends(get_empresa_id),
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
