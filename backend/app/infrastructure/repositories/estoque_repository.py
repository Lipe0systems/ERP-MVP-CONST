"""
Implementação SQLAlchemy do EstoqueRepository.
Camada: Infrastructure.
"""
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.entities.estoque import ItemEstoque
from app.domain.exceptions import DuplicateValueError
from app.domain.repositories.estoque_repository import EstoqueRepository
from app.infrastructure.database.models.estoque import ItemEstoqueModel


def _to_float(value) -> float | None:
    return float(value) if value is not None else None


def _to_entity(model: ItemEstoqueModel) -> ItemEstoque:
    return ItemEstoque(
        id=model.id,
        empresa_id=model.empresa_id,
        produto=model.produto,
        quantidade=_to_float(model.quantidade),
        valor_medio=_to_float(model.valor_medio),
        unidade=model.unidade,
        observacoes=model.observacoes,
        criado_em=model.criado_em,
    )


class SqlAlchemyEstoqueRepository(EstoqueRepository):
    def __init__(self, db: Session):
        self.db = db

    def list(
        self, empresa_id: UUID, search: str | None, page: int, page_size: int
    ) -> tuple[list[ItemEstoque], int]:
        query = self.db.query(ItemEstoqueModel).filter(ItemEstoqueModel.empresa_id == empresa_id)

        if search:
            termo = f"%{search.strip()}%"
            query = query.filter(ItemEstoqueModel.produto.ilike(termo))

        total = query.with_entities(func.count(ItemEstoqueModel.id)).scalar() or 0

        registros = (
            query.order_by(ItemEstoqueModel.produto.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return [_to_entity(m) for m in registros], total

    def get_by_id(self, empresa_id: UUID, item_id: UUID) -> ItemEstoque | None:
        model = (
            self.db.query(ItemEstoqueModel)
            .filter(ItemEstoqueModel.empresa_id == empresa_id, ItemEstoqueModel.id == item_id)
            .first()
        )
        return _to_entity(model) if model else None

    def get_by_produto(self, empresa_id: UUID, produto: str) -> ItemEstoque | None:
        model = (
            self.db.query(ItemEstoqueModel)
            .filter(
                ItemEstoqueModel.empresa_id == empresa_id,
                func.lower(ItemEstoqueModel.produto) == produto.lower(),
            )
            .first()
        )
        return _to_entity(model) if model else None

    def create(self, item: ItemEstoque) -> ItemEstoque:
        model = ItemEstoqueModel(
            id=item.id,
            empresa_id=item.empresa_id,
            produto=item.produto,
            quantidade=item.quantidade,
            unidade=item.unidade,
            valor_medio=item.valor_medio,
            observacoes=item.observacoes,
        )
        self.db.add(model)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise DuplicateValueError(
                "Já existe um item de estoque cadastrado com este produto."
            ) from exc
        self.db.refresh(model)
        return _to_entity(model)

    def update(self, item: ItemEstoque) -> ItemEstoque:
        model = (
            self.db.query(ItemEstoqueModel)
            .filter(ItemEstoqueModel.empresa_id == item.empresa_id, ItemEstoqueModel.id == item.id)
            .first()
        )
        if model is None:
            raise ValueError("Item de estoque não encontrado")

        model.produto = item.produto
        model.quantidade = item.quantidade
        model.unidade = item.unidade
        model.valor_medio = item.valor_medio
        model.observacoes = item.observacoes

        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise DuplicateValueError(
                "Já existe um item de estoque cadastrado com este produto."
            ) from exc
        self.db.refresh(model)
        return _to_entity(model)

    def delete(self, empresa_id: UUID, item_id: UUID) -> bool:
        model = (
            self.db.query(ItemEstoqueModel)
            .filter(ItemEstoqueModel.empresa_id == empresa_id, ItemEstoqueModel.id == item_id)
            .first()
        )
        if model is None:
            return False
        self.db.delete(model)
        self.db.commit()
        return True
