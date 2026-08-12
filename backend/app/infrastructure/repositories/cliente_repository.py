"""
Implementação SQLAlchemy do ClienteRepository.
Camada: Infrastructure.
"""
from __future__ import annotations
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.entities.cliente import Cliente
from app.domain.exceptions import DependencyExistsError
from app.domain.repositories.cliente_repository import ClienteRepository
from app.infrastructure.database.models.cliente import ClienteModel
from datetime import datetime


def _to_entity(model: ClienteModel) -> Cliente:
    return Cliente(
        id=model.id,
        empresa_id=model.empresa_id,
        nome=model.nome,
        documento=model.documento,
        email=model.email,
        telefone=model.telefone,
        whatsapp=model.whatsapp,
        rg=model.rg,
        sexo=model.sexo,
        data_nascimento=model.data_nascimento,
        cep=model.cep,
        logradouro=model.logradouro,
        numero=model.numero,
        complemento=model.complemento,
        bairro=model.bairro,
        cidade=model.cidade,
        estado=model.estado,
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
            whatsapp=cliente.whatsapp,
            rg=cliente.rg,
            sexo=cliente.sexo,
            data_nascimento=cliente.data_nascimento,
            cep=cliente.cep,
            logradouro=cliente.logradouro,
            numero=cliente.numero,
            complemento=cliente.complemento,
            bairro=cliente.bairro,
            cidade=cliente.cidade,
            estado=cliente.estado,
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
        model.whatsapp = cliente.whatsapp
        model.rg = cliente.rg
        model.sexo = cliente.sexo
        model.data_nascimento = cliente.data_nascimento
        model.cep = cliente.cep
        model.logradouro = cliente.logradouro
        model.numero = cliente.numero
        model.complemento = cliente.complemento
        model.bairro = cliente.bairro
        model.cidade = cliente.cidade
        model.estado = cliente.estado
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
            model.deletado_em = datetime.utcnow()
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
