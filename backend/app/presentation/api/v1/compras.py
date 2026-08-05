"""
Endpoints REST do módulo Compras.
Camada: Presentation — converte HTTP <-> casos de uso, sem regra de negócio aqui.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.application.use_cases.compra_use_cases import CompraUseCases
from app.core.security import get_empresa_id
from app.domain.entities.compra import StatusCompra
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.compra_repository import SqlAlchemyCompraRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository
from app.presentation.schemas.compra import CompraCreate, CompraListOut, CompraOut, CompraUpdate

router = APIRouter(prefix="/compras", tags=["Compras"])


def _get_use_cases(db: Session = Depends(get_db)) -> CompraUseCases:
    return CompraUseCases(
        repository=SqlAlchemyCompraRepository(db),
        obra_repository=SqlAlchemyObraRepository(db),
    )


@router.get("", response_model=CompraListOut)
def listar_compras(
    search: str | None = Query(None, description="Busca por produto ou fornecedor"),
    status_filtro: StatusCompra | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: CompraUseCases = Depends(_get_use_cases),
):
    itens, total = use_cases.listar(empresa_id, search, status_filtro, page, page_size)
    return CompraListOut(items=itens, total=total, page=page, page_size=page_size)


@router.get("/{compra_id}", response_model=CompraOut)
def obter_compra(
    compra_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: CompraUseCases = Depends(_get_use_cases),
):
    return use_cases.obter(empresa_id, compra_id)


@router.post("", response_model=CompraOut, status_code=status.HTTP_201_CREATED)
def criar_compra(
    payload: CompraCreate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: CompraUseCases = Depends(_get_use_cases),
):
    return use_cases.criar(
        empresa_id=empresa_id,
        fornecedor=payload.fornecedor,
        produto=payload.produto,
        quantidade=payload.quantidade,
        valor_unitario=payload.valor_unitario,
        data_compra=payload.data_compra,
        unidade=payload.unidade,
        obra_id=payload.obra_id,
        status_compra=payload.status,
        observacoes=payload.observacoes,
    )


@router.put("/{compra_id}", response_model=CompraOut)
def atualizar_compra(
    compra_id: UUID,
    payload: CompraUpdate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: CompraUseCases = Depends(_get_use_cases),
):
    return use_cases.atualizar(
        empresa_id=empresa_id,
        compra_id=compra_id,
        fornecedor=payload.fornecedor,
        produto=payload.produto,
        quantidade=payload.quantidade,
        valor_unitario=payload.valor_unitario,
        data_compra=payload.data_compra,
        unidade=payload.unidade,
        obra_id=payload.obra_id,
        status_compra=payload.status,
        observacoes=payload.observacoes,
    )


@router.delete("/{compra_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_compra(
    compra_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: CompraUseCases = Depends(_get_use_cases),
):
    use_cases.remover(empresa_id, compra_id)
