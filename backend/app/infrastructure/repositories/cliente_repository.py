"""
Implementação SQLAlchemy do ClienteRepository.
Camada: Infrastructure.
"""
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.entities.cliente import Cliente
from app.domain.exceptions import DependencyExistsError
from app.domain.repositories.cliente_repository import ClienteRepository
from app.infrastructure.database.models.cliente import ClienteModel


def _to_entity(model: ClienteModel) -> Cliente:
    return Cliente(
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


class SqlAlchemyClienteRepository(ClienteRepository):
    def __init__(self, db: Session):
        self.db = db

    def list(
        self, empresa_id: UUID, search: str | None, page: int, page_size: int
    ) -> tuple[list[Cliente], int]:
        query = self.db.query(ClienteModel).filter(ClienteModel.empresa_id == empresa_id)

        if search:
            termo = f"%{search.strip()}%"
            query = query.filter(
                or_(ClienteModel.nome.ilike(termo), ClienteModel.documento.ilike(termo))
            )

        total = query.with_entities(func.count(ClienteModel.id)).scalar() or 0

        registros = (
            query.order_by(ClienteModel.criado_em.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return [_to_entity(m) for m in registros], total

    def get_by_id(self, empresa_id: UUID, cliente_id: UUID) -> Cliente | None:
        model = (
            self.db.query(ClienteModel)
            .filter(ClienteModel.empresa_id == empresa_id, ClienteModel.id == cliente_id)
            .first()
        )
        return _to_entity(model) if model else None

    def get_by_documento(self, empresa_id: UUID, documento: str) -> Cliente | None:
        model = (
            self.db.query(ClienteModel)
            .filter(ClienteModel.empresa_id == empresa_id, ClienteModel.documento == documento)
            .first()
        )
        return _to_entity(model) if model else None

    def create(self, cliente: Cliente) -> Cliente:
        model = ClienteModel(
            id=cliente.id,
            empresa_id=cliente.empresa_id,
            nome=cliente.nome,
            documento=cliente.documento,
            email=cliente.email,
            telefone=cliente.telefone,
            endereco=cliente.endereco,
            observacoes=cliente.observacoes,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def update(self, cliente: Cliente) -> Cliente:
        model = (
            self.db.query(ClienteModel)
            .filter(ClienteModel.empresa_id == cliente.empresa_id, ClienteModel.id == cliente.id)
            .first()
        )
        if model is None:
            raise ValueError("Cliente não encontrado")

        model.nome = cliente.nome
        model.documento = cliente.documento
        model.email = cliente.email
        model.telefone = cliente.telefone
        model.endereco = cliente.endereco
        model.observacoes = cliente.observacoes

        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def delete(self, empresa_id: UUID, cliente_id: UUID) -> bool:
        model = (
            self.db.query(ClienteModel)
            .filter(ClienteModel.empresa_id == empresa_id, ClienteModel.id == cliente_id)
            .first()
        )
        if model is None:
            return False
        try:
            self.db.delete(model)
            self.db.commit()
        except IntegrityError as exc:
            # Ocorre quando o cliente possui registros dependentes (ex.: Obras)
            # com FK RESTRICT — traduzimos para uma exceção de domínio em vez
            # de deixar o IntegrityError (detalhe de infraestrutura) vazar.
            self.db.rollback()
            raise DependencyExistsError(
                "Cliente possui registros vinculados (obras, contas a receber) e não pode ser removido."
            ) from exc
        return True

    def contar(self, empresa_id: UUID) -> int:
        return (
            self.db.query(func.count(ClienteModel.id))
            .filter(ClienteModel.empresa_id == empresa_id)
            .scalar()
            or 0
        )
