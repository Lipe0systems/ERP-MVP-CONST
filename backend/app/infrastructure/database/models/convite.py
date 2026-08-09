"""Modelo ORM: ConviteUsuario. Camada: Infrastructure."""
from __future__ import annotations
from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.infrastructure.database.models.base import TenantModel


class ConviteUsuarioModel(TenantModel):
    __tablename__ = "convites_usuario"

    email = Column(String(255), nullable=False, index=True)
    papel = Column(String(20), nullable=False, default="membro")
    token = Column(String(64), nullable=False, unique=True, index=True)
    status = Column(String(20), nullable=False, default="pendente")
    criado_por_id = Column(PGUUID(as_uuid=True))
    expira_em = Column(DateTime, nullable=False)
