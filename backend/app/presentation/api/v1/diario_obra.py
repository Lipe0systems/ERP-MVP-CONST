"""
Endpoints REST do módulo Diário de Obra.
Camada: Presentation — converte HTTP <-> casos de uso, sem regra de negócio aqui.
O upload dos arquivos de foto acontece direto do frontend para o Supabase
Storage; aqui só trafegam as URLs já publicadas (ver docs/DEPLOY.md).
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.application.use_cases.diario_obra_use_cases import DiarioObraUseCases
from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.diario_obra_repository import SqlAlchemyDiarioObraRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository
from app.presentation.schemas.diario_obra import (
    RegistroDiarioCreate,
    RegistroDiarioListOut,
    RegistroDiarioOut,
    RegistroDiarioUpdate,
)

router = APIRouter(prefix="/diario-obra", tags=["Diário de Obra"])


def _get_use_cases(db: Session = Depends(get_db)) -> DiarioObraUseCases:
    return DiarioObraUseCases(
        repository=SqlAlchemyDiarioObraRepository(db),
        obra_repository=SqlAlchemyObraRepository(db),
    )


@router.get("", response_model=RegistroDiarioListOut)
def listar_registros(
    obra_id: UUID | None = Query(None, description="Filtra por obra"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: DiarioObraUseCases = Depends(_get_use_cases),
):
    itens, total = use_cases.listar(empresa_id, obra_id, page, page_size)
    return RegistroDiarioListOut(items=itens, total=total, page=page, page_size=page_size)


@router.get("/{registro_id}", response_model=RegistroDiarioOut)
def obter_registro(
    registro_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: DiarioObraUseCases = Depends(_get_use_cases),
):
    return use_cases.obter(empresa_id, registro_id)


@router.post("", response_model=RegistroDiarioOut, status_code=status.HTTP_201_CREATED)
def criar_registro(
    payload: RegistroDiarioCreate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: DiarioObraUseCases = Depends(_get_use_cases),
):
    return use_cases.criar(
        empresa_id=empresa_id,
        obra_id=payload.obra_id,
        data_registro=payload.data,
        observacoes=payload.observacoes,
        clima=payload.clima,
        fotos=payload.fotos,
    )


@router.put("/{registro_id}", response_model=RegistroDiarioOut)
def atualizar_registro(
    registro_id: UUID,
    payload: RegistroDiarioUpdate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: DiarioObraUseCases = Depends(_get_use_cases),
):
    return use_cases.atualizar(
        empresa_id=empresa_id,
        registro_id=registro_id,
        obra_id=payload.obra_id,
        data_registro=payload.data,
        observacoes=payload.observacoes,
        clima=payload.clima,
        fotos=payload.fotos,
    )


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_registro(
    registro_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: DiarioObraUseCases = Depends(_get_use_cases),
):
    use_cases.remover(empresa_id, registro_id)
