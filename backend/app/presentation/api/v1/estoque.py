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
from app.infrastructure.database.models.historico_preco import HistoricoPrecoEstoqueModel
from sqlalchemy import func
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


@router.get("/abaixo-do-minimo")
def itens_abaixo_do_minimo(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    """Lista itens cuja quantidade está abaixo do estoque mínimo configurado."""
    from app.infrastructure.database.models.estoque import ItemEstoqueModel
    itens = db.query(ItemEstoqueModel).filter(
        ItemEstoqueModel.empresa_id == empresa_id,
        ItemEstoqueModel.estoque_minimo.isnot(None),
        ItemEstoqueModel.quantidade < ItemEstoqueModel.estoque_minimo,
    ).all()
    return [
        {
            "id": str(i.id),
            "produto": i.produto,
            "quantidade": float(i.quantidade),
            "estoque_minimo": float(i.estoque_minimo),
            "falta": round(float(i.estoque_minimo) - float(i.quantidade), 3),
            "unidade": i.unidade,
        }
        for i in itens
    ]


@router.get("/{item_id}/historico-precos")
def historico_precos(
    item_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Retorna o histórico de entradas de preço de um item do estoque."""
    from app.infrastructure.database.models.estoque import ItemEstoqueModel
    item = db.query(ItemEstoqueModel).filter(
        ItemEstoqueModel.empresa_id == empresa_id,
        ItemEstoqueModel.id == item_id,
    ).first()
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Item não encontrado.")

    total = db.query(func.count(HistoricoPrecoEstoqueModel.id)).filter(
        HistoricoPrecoEstoqueModel.empresa_id == empresa_id,
        HistoricoPrecoEstoqueModel.produto == item.produto,
    ).scalar() or 0

    rows = db.query(HistoricoPrecoEstoqueModel).filter(
        HistoricoPrecoEstoqueModel.empresa_id == empresa_id,
        HistoricoPrecoEstoqueModel.produto == item.produto,
    ).order_by(HistoricoPrecoEstoqueModel.criado_em.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "produto": item.produto,
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": str(r.id),
                "quantidade": float(r.quantidade),
                "valor_unitario": float(r.valor_unitario),
                "origem": r.origem,
                "criado_em": r.criado_em.isoformat(),
            }
            for r in rows
        ],
    }
