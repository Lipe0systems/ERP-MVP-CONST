"""
Endpoints REST do módulo Estoque.
Camada: Presentation — converte HTTP <-> casos de uso, sem regra de negócio aqui.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.application.use_cases.estoque_use_cases import EstoqueUseCases
from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.estoque_repository import SqlAlchemyEstoqueRepository
from app.presentation.schemas.estoque import (
    ItemEstoqueCreate,
    ItemEstoqueListOut,
    ItemEstoqueOut,
    ItemEstoqueUpdate,
)

router = APIRouter(prefix="/estoque", tags=["Estoque"])


def _get_use_cases(db: Session = Depends(get_db)) -> EstoqueUseCases:
    return EstoqueUseCases(SqlAlchemyEstoqueRepository(db))


@router.get("", response_model=ItemEstoqueListOut)
def listar_estoque(
    search: str | None = Query(None, description="Busca por produto"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: EstoqueUseCases = Depends(_get_use_cases),
):
    itens, total = use_cases.listar(empresa_id, search, page, page_size)
    return ItemEstoqueListOut(
        items=[ItemEstoqueOut.model_validate(i) for i in itens],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{item_id}", response_model=ItemEstoqueOut)
def obter_item_estoque(
    item_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: EstoqueUseCases = Depends(_get_use_cases),
):
    return use_cases.obter(empresa_id, item_id)


@router.post("", response_model=ItemEstoqueOut, status_code=status.HTTP_201_CREATED)
def criar_item_estoque(
    payload: ItemEstoqueCreate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: EstoqueUseCases = Depends(_get_use_cases),
):
    return use_cases.criar(
        empresa_id=empresa_id,
        produto=payload.produto,
        quantidade=payload.quantidade,
        valor_medio=payload.valor_medio,
        unidade=payload.unidade,
        observacoes=payload.observacoes,
    )


@router.put("/{item_id}", response_model=ItemEstoqueOut)
def atualizar_item_estoque(
    item_id: UUID,
    payload: ItemEstoqueUpdate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: EstoqueUseCases = Depends(_get_use_cases),
):
    return use_cases.atualizar(
        empresa_id=empresa_id,
        item_id=item_id,
        produto=payload.produto,
        quantidade=payload.quantidade,
        valor_medio=payload.valor_medio,
        unidade=payload.unidade,
        observacoes=payload.observacoes,
    )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_item_estoque(
    item_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: EstoqueUseCases = Depends(_get_use_cases),
):
    use_cases.remover(empresa_id, item_id)
