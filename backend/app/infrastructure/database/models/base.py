"""
Mixin base para todos os modelos: UUID como PK e vínculo multi-tenant.
Inclui suporte a soft delete (coluna deletado_em) — ver soft_delete.py.
Camada: Infrastructure.
"""
from __future__ import annotations
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.infrastructure.database.session import Base


class BaseModel(Base):
    __abstract__ = True

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Soft delete: quando preenchido, o registro está "na lixeira".
    deletado_em = Column(DateTime, nullable=True, index=True)


class TenantModel(BaseModel):
    """Modelo base para toda entidade que pertence a uma empresa (tenant)."""
    __abstract__ = True

    empresa_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
