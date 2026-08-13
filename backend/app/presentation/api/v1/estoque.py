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
from app.infrastructure.database.models.movimentacao_estoque import MovimentacaoEstoqueModel
from app.infrastructure.database.models.estoque import ItemEstoqueModel
from app.core.security import get_current_user, CurrentUser
from app.application.services.auditoria_service import registrar as audit
from app.domain.entities.auditoria import AcaoAuditoria
from pydantic import BaseModel, Field
from datetime import datetime
import uuid as _uuid
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

# ═══ V4 — Movimentações de estoque (rastreabilidade / Fluxo 4) ═════════════

class MovimentacaoIn(BaseModel):
    estoque_id: UUID
    tipo: str = Field(pattern="^(transferencia|consumo|ajuste)$")
    quantidade: float = Field(gt=0)
    obra_id: UUID | None = None
    observacao: str | None = None


@router.get("/movimentacoes")
def listar_movimentacoes(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    obra_id: UUID | None = None,
    estoque_id: UUID | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Histórico de movimentações — entradas, transferências, consumos e ajustes."""
    q = db.query(MovimentacaoEstoqueModel).filter(MovimentacaoEstoqueModel.empresa_id == empresa_id)
    if obra_id:
        q = q.filter(MovimentacaoEstoqueModel.obra_id == obra_id)
    if estoque_id:
        q = q.filter(MovimentacaoEstoqueModel.estoque_id == estoque_id)
    total = q.count()
    rows = q.order_by(MovimentacaoEstoqueModel.criado_em.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total, "page": page, "page_size": page_size,
        "items": [
            {
                "id": str(m.id), "produto": m.produto, "tipo": m.tipo,
                "quantidade": float(m.quantidade), "origem": m.origem, "destino": m.destino,
                "obra_id": str(m.obra_id) if m.obra_id else None,
                "observacao": m.observacao, "criado_em": m.criado_em.isoformat(),
            }
            for m in rows
        ],
    }


@router.post("/movimentacoes", status_code=201)
def registrar_movimentacao(
    body: MovimentacaoIn,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Registra uma movimentação manual de estoque: transferência para obra,
    consumo na obra, ou ajuste de inventário. Atualiza a quantidade do item.
    """
    from fastapi import HTTPException

    item = db.query(ItemEstoqueModel).filter(
        ItemEstoqueModel.empresa_id == empresa_id, ItemEstoqueModel.id == body.estoque_id
    ).first()
    if not item:
        raise HTTPException(404, "Item de estoque não encontrado.")

    if body.tipo in ("transferencia", "consumo") and float(item.quantidade) < body.quantidade:
        raise HTTPException(422, f"Quantidade insuficiente em estoque ({float(item.quantidade)} disponível).")

    # Ajuste pode somar ou subtrair; transferência/consumo sempre reduz o saldo central.
    if body.tipo == "ajuste":
        # Ajuste positivo soma, mas aqui tratamos a quantidade sempre como delta absoluto
        # aplicado — o sinal fica a critério do observacao/uso; simplificamos para reposição.
        item.quantidade = float(item.quantidade) + body.quantidade
    else:
        item.quantidade = float(item.quantidade) - body.quantidade

    mov = MovimentacaoEstoqueModel(
        id=_uuid.uuid4(),
        empresa_id=empresa_id,
        estoque_id=item.id,
        produto=item.produto,
        tipo=body.tipo,
        quantidade=body.quantidade,
        origem="estoque_central" if body.tipo in ("transferencia", "consumo") else "ajuste",
        destino="obra" if body.obra_id else None,
        obra_id=body.obra_id,
        usuario_id=current_user.id,
        observacao=body.observacao,
    )
    db.add(mov)
    db.commit()

    try:
        audit(db, usuario=current_user, modulo="estoque", acao=AcaoAuditoria.EDITOU,
              entidade_id=str(mov.id),
              descricao=f"{body.tipo.capitalize()}: {body.quantidade} de {item.produto}" + (f" (obra vinculada)" if body.obra_id else "") + ".")
    except Exception:
        pass

    return {
        "id": str(mov.id), "tipo": mov.tipo, "quantidade": float(mov.quantidade),
        "saldo_atual": float(item.quantidade),
    }


@router.get("/custo-material-obra")
def custo_material_por_obra(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    obra_id: UUID | None = None,
):
    """
    Custo de materiais por obra (Fluxo 4/6), calculado a partir das
    movimentações REALMENTE associadas à obra (consumo + transferência +
    compras diretas) — nunca a soma de todas as compras da empresa.
    """
    q = (
        db.query(
            MovimentacaoEstoqueModel.obra_id,
            func.sum(MovimentacaoEstoqueModel.quantidade * ItemEstoqueModel.valor_medio).label("custo"),
        )
        .join(ItemEstoqueModel, ItemEstoqueModel.id == MovimentacaoEstoqueModel.estoque_id)
        .filter(
            MovimentacaoEstoqueModel.empresa_id == empresa_id,
            MovimentacaoEstoqueModel.obra_id.isnot(None),
            MovimentacaoEstoqueModel.tipo.in_(["entrada", "transferencia", "consumo"]),
        )
    )
    if obra_id:
        q = q.filter(MovimentacaoEstoqueModel.obra_id == obra_id)
    q = q.group_by(MovimentacaoEstoqueModel.obra_id)

    return [
        {"obra_id": str(oid), "custo_material": float(custo or 0)}
        for oid, custo in q.all()
    ]
