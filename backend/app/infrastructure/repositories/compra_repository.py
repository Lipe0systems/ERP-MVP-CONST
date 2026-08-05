"""
Implementação SQLAlchemy do CompraRepository.
Camada: Infrastructure.
"""
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.domain.entities.compra import Compra, StatusCompra
from app.domain.repositories.compra_repository import CompraRepository
from app.infrastructure.database.models.compra import CompraModel
from app.infrastructure.database.models.obra import ObraModel


def _to_float(value) -> float | None:
    return float(value) if value is not None else None


def _to_entity(model: CompraModel) -> Compra:
    return Compra(
        id=model.id,
        empresa_id=model.empresa_id,
        fornecedor=model.fornecedor,
        produto=model.produto,
        quantidade=_to_float(model.quantidade),
        unidade=model.unidade,
        valor_unitario=_to_float(model.valor_unitario),
        data_compra=model.data_compra,
        obra_id=model.obra_id,
        status=StatusCompra(model.status),
        observacoes=model.observacoes,
        criado_em=model.criado_em,
    )


def _to_dict_com_obra(model: CompraModel, obra_nome: str | None) -> dict:
    return {
        "id": model.id,
        "fornecedor": model.fornecedor,
        "produto": model.produto,
        "quantidade": _to_float(model.quantidade),
        "unidade": model.unidade,
        "valor_unitario": _to_float(model.valor_unitario),
        "data_compra": model.data_compra,
        "obra_id": model.obra_id,
        "obra_nome": obra_nome,
        "status": model.status,
        "observacoes": model.observacoes,
        "criado_em": model.criado_em,
    }


class SqlAlchemyCompraRepository(CompraRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_with_obra_nome(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: StatusCompra | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        # LEFT JOIN (isouter=True): obra_id é opcional, então uma compra sem
        # obra vinculada não pode ser excluída do resultado por um JOIN comum.
        query = (
            self.db.query(CompraModel, ObraModel.nome)
            .outerjoin(ObraModel, ObraModel.id == CompraModel.obra_id)
            .filter(CompraModel.empresa_id == empresa_id)
        )

        if search:
            termo = f"%{search.strip()}%"
            query = query.filter(
                or_(CompraModel.produto.ilike(termo), CompraModel.fornecedor.ilike(termo))
            )
        if status_filtro:
            query = query.filter(CompraModel.status == status_filtro.value)

        total = query.with_entities(func.count(CompraModel.id)).scalar() or 0

        rows = (
            query.order_by(CompraModel.data_compra.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return [_to_dict_com_obra(compra, obra_nome) for compra, obra_nome in rows], total

    def get_by_id(self, empresa_id: UUID, compra_id: UUID) -> Compra | None:
        model = (
            self.db.query(CompraModel)
            .filter(CompraModel.empresa_id == empresa_id, CompraModel.id == compra_id)
            .first()
        )
        return _to_entity(model) if model else None

    def create(self, compra: Compra) -> Compra:
        model = CompraModel(
            id=compra.id,
            empresa_id=compra.empresa_id,
            fornecedor=compra.fornecedor,
            produto=compra.produto,
            quantidade=compra.quantidade,
            unidade=compra.unidade,
            valor_unitario=compra.valor_unitario,
            data_compra=compra.data_compra,
            obra_id=compra.obra_id,
            status=compra.status.value,
            observacoes=compra.observacoes,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def update(self, compra: Compra) -> Compra:
        model = (
            self.db.query(CompraModel)
            .filter(CompraModel.empresa_id == compra.empresa_id, CompraModel.id == compra.id)
            .first()
        )
        if model is None:
            raise ValueError("Compra não encontrada")

        model.fornecedor = compra.fornecedor
        model.produto = compra.produto
        model.quantidade = compra.quantidade
        model.unidade = compra.unidade
        model.valor_unitario = compra.valor_unitario
        model.data_compra = compra.data_compra
        model.obra_id = compra.obra_id
        model.status = compra.status.value
        model.observacoes = compra.observacoes

        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def delete(self, empresa_id: UUID, compra_id: UUID) -> bool:
        model = (
            self.db.query(CompraModel)
            .filter(CompraModel.empresa_id == empresa_id, CompraModel.id == compra_id)
            .first()
        )
        if model is None:
            return False
        self.db.delete(model)
        self.db.commit()
        return True
