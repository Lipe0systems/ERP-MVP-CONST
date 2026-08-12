"""Modelo ORM: AlocacaoObra — vínculo funcionário ↔ obra. Camada: Infrastructure."""
from __future__ import annotations
from sqlalchemy import Boolean, Column, Date, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.infrastructure.database.models.base import TenantModel


class AlocacaoObraModel(TenantModel):
    __tablename__ = "alocacoes_obra"

    funcionario_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    obra_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date)
    funcao = Column(String(120))
    ativa = Column(Boolean, nullable=False, default=True)
