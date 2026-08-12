"""
Implementação SQLAlchemy do DiarioObraRepository.
Camada: Infrastructure.
"""
from __future__ import annotations
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domain.entities.diario_obra import ClimaObra, RegistroDiario
from app.domain.repositories.diario_obra_repository import DiarioObraRepository
from app.infrastructure.database.models.diario_obra import RegistroDiarioModel
from app.infrastructure.database.models.obra import ObraModel
from datetime import datetime


def _to_entity(model: RegistroDiarioModel) -> RegistroDiario:
    return RegistroDiario(
        id=model.id,
        empresa_id=model.empresa_id,
        obra_id=model.obra_id,
        data=model.data,
        observacoes=model.observacoes,
        clima=ClimaObra(model.clima) if model.clima else None,
        fotos=list(model.fotos or []),
        criado_em=model.criado_em,
    )


def _to_dict_com_obra(model: RegistroDiarioModel, obra_nome: str) -> dict:
    return {
        "id": model.id,
        "obra_id": model.obra_id,
        "obra_nome": obra_nome,
        "data": model.data,
        "observacoes": model.observacoes,
        "clima": model.clima,
        "fotos": list(model.fotos or []),
        "criado_em": model.criado_em,
    }


class SqlAlchemyDiarioObraRepository(DiarioObraRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_with_obra_nome(
        self,
        empresa_id: UUID,
        obra_id: UUID | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        # INNER JOIN (não outerjoin): obra é obrigatória em todo registro de
        # diário, diferente do vínculo opcional usado em Compras/Financeiro.
        query = (
            self.db.query(RegistroDiarioModel, ObraModel.nome)
            .join(ObraModel, ObraModel.id == RegistroDiarioModel.obra_id)
            .filter(RegistroDiarioModel.empresa_id == empresa_id)
        )

        if obra_id:
            query = query.filter(RegistroDiarioModel.obra_id == obra_id)

        total = query.with_entities(func.count(RegistroDiarioModel.id)).scalar() or 0

        rows = (
            query.order_by(RegistroDiarioModel.data.desc(), RegistroDiarioModel.criado_em.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return [_to_dict_com_obra(registro, obra_nome) for registro, obra_nome in rows], total

    def get_by_id(self, empresa_id: UUID, registro_id: UUID) -> RegistroDiario | None:
        model = (
            self.db.query(RegistroDiarioModel)
            .filter(RegistroDiarioModel.empresa_id == empresa_id, RegistroDiarioModel.id == registro_id)
            .first()
        )
        return _to_entity(model) if model else None

    def create(self, registro: RegistroDiario) -> RegistroDiario:
        model = RegistroDiarioModel(
            id=registro.id,
            empresa_id=registro.empresa_id,
            obra_id=registro.obra_id,
            data=registro.data,
            observacoes=registro.observacoes,
            clima=registro.clima.value if registro.clima else None,
            fotos=registro.fotos,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def update(self, registro: RegistroDiario) -> RegistroDiario:
        model = (
            self.db.query(RegistroDiarioModel)
            .filter(RegistroDiarioModel.empresa_id == registro.empresa_id, RegistroDiarioModel.id == registro.id)
            .first()
        )
        if model is None:
            raise ValueError("Registro de diário não encontrado")

        model.obra_id = registro.obra_id
        model.data = registro.data
        model.observacoes = registro.observacoes
        model.clima = registro.clima.value if registro.clima else None
        model.fotos = registro.fotos

        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def delete(self, empresa_id: UUID, registro_id: UUID) -> bool:
        model = (
            self.db.query(RegistroDiarioModel)
            .filter(RegistroDiarioModel.empresa_id == empresa_id, RegistroDiarioModel.id == registro_id)
            .first()
        )
        if model is None:
            return False
        model.deletado_em = datetime.utcnow()
        self.db.commit()
        return True
