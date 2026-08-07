"""Implementação SQLAlchemy do FornecedorRepository. Camada: Infrastructure."""
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domain.entities.fornecedor import Fornecedor
from app.domain.repositories.fornecedor_repository import FornecedorRepository
from app.infrastructure.database.models.fornecedor import FornecedorModel


def _to_entity(model: FornecedorModel) -> Fornecedor:
    return Fornecedor(
        id=model.id,
        empresa_id=model.empresa_id,
        nome=model.nome,
        documento=model.documento,
        email=model.email,
        telefone=model.telefone,
        endereco=model.endereco,
        observacoes=model.observacoes,
        criado_em=model.criado_em,
    )


class SqlAlchemyFornecedorRepository(FornecedorRepository):
    def __init__(self, db: Session):
        self.db = db

    def list(self, empresa_id: UUID, search: str | None, page: int, page_size: int) -> tuple[list[Fornecedor], int]:
        query = self.db.query(FornecedorModel).filter(FornecedorModel.empresa_id == empresa_id)
        if search:
            query = query.filter(FornecedorModel.nome.ilike(f"%{search.strip()}%"))
        total = query.with_entities(func.count(FornecedorModel.id)).scalar() or 0
        items = query.order_by(FornecedorModel.nome).offset((page - 1) * page_size).limit(page_size).all()
        return [_to_entity(m) for m in items], total

    def get_by_id(self, empresa_id: UUID, fornecedor_id: UUID) -> Fornecedor | None:
        model = self.db.query(FornecedorModel).filter(
            FornecedorModel.empresa_id == empresa_id,
            FornecedorModel.id == fornecedor_id,
        ).first()
        return _to_entity(model) if model else None

    def create(self, fornecedor: Fornecedor) -> Fornecedor:
        model = FornecedorModel(
            id=fornecedor.id, empresa_id=fornecedor.empresa_id,
            nome=fornecedor.nome, documento=fornecedor.documento,
            email=fornecedor.email, telefone=fornecedor.telefone,
            endereco=fornecedor.endereco, observacoes=fornecedor.observacoes,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def update(self, fornecedor: Fornecedor) -> Fornecedor:
        model = self.db.query(FornecedorModel).filter(
            FornecedorModel.empresa_id == fornecedor.empresa_id,
            FornecedorModel.id == fornecedor.id,
        ).first()
        if model is None:
            raise ValueError("Fornecedor não encontrado")
        model.nome = fornecedor.nome
        model.documento = fornecedor.documento
        model.email = fornecedor.email
        model.telefone = fornecedor.telefone
        model.endereco = fornecedor.endereco
        model.observacoes = fornecedor.observacoes
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def delete(self, empresa_id: UUID, fornecedor_id: UUID) -> bool:
        model = self.db.query(FornecedorModel).filter(
            FornecedorModel.empresa_id == empresa_id,
            FornecedorModel.id == fornecedor_id,
        ).first()
        if model is None:
            return False
        self.db.delete(model)
        self.db.commit()
        return True
