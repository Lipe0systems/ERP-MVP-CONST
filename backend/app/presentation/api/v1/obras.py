"""
Endpoints REST do módulo Obras.
Camada: Presentation — converte HTTP <-> casos de uso, sem regra de negócio aqui.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.application.use_cases.obra_use_cases import ObraUseCases
from app.core.security import get_empresa_id
from app.domain.entities.obra import ObraStatus
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository
from app.presentation.schemas.obra import ObraCreate, ObraListOut, ObraOut, ObraUpdate

router = APIRouter(prefix="/obras", tags=["Obras"])


def _get_use_cases(db: Session = Depends(get_db)) -> ObraUseCases:
    return ObraUseCases(
        obra_repository=SqlAlchemyObraRepository(db),
        cliente_repository=SqlAlchemyClienteRepository(db),
    )


@router.get("", response_model=ObraListOut)
def listar_obras(
    search: str | None = Query(None, description="Busca por nome da obra ou do cliente"),
    status_filtro: ObraStatus | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    itens, total = use_cases.listar(empresa_id, search, status_filtro, page, page_size)
    return ObraListOut(items=itens, total=total, page=page, page_size=page_size)


@router.get("/{obra_id}", response_model=ObraOut)
def obter_obra(
    obra_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    return use_cases.obter(empresa_id, obra_id)


@router.post("", response_model=ObraOut, status_code=status.HTTP_201_CREATED)
def criar_obra(
    payload: ObraCreate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    return use_cases.criar(
        empresa_id=empresa_id,
        nome=payload.nome,
        cliente_id=payload.cliente_id,
        endereco=payload.endereco,
        responsavel=payload.responsavel,
        data_inicio=payload.data_inicio,
        data_previsao=payload.data_previsao,
        status_obra=payload.status,
        valor_previsto=payload.valor_previsto,
        valor_realizado=payload.valor_realizado,
    )


@router.put("/{obra_id}", response_model=ObraOut)
def atualizar_obra(
    obra_id: UUID,
    payload: ObraUpdate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    return use_cases.atualizar(
        empresa_id=empresa_id,
        obra_id=obra_id,
        nome=payload.nome,
        cliente_id=payload.cliente_id,
        endereco=payload.endereco,
        responsavel=payload.responsavel,
        data_inicio=payload.data_inicio,
        data_previsao=payload.data_previsao,
        status_obra=payload.status,
        valor_previsto=payload.valor_previsto,
        valor_realizado=payload.valor_realizado,
    )


@router.delete("/{obra_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_obra(
    obra_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    use_cases.remover(empresa_id, obra_id)
