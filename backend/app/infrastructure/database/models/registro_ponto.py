"""Modelo ORM: RegistroPonto — folha de ponto diária. Camada: Infrastructure."""
from __future__ import annotations
from sqlalchemy import Column, Date, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.infrastructure.database.models.base import TenantModel


class RegistroPontoModel(TenantModel):
    __tablename__ = "registros_ponto"

    funcionario_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    obra_id = Column(PGUUID(as_uuid=True), index=True)
    data = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="presente")
    horas = Column(Numeric(5, 2))
    observacoes = Column(Text)
