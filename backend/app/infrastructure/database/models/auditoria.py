"""Modelo ORM: RegistroAuditoria. Camada: Infrastructure."""
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from app.infrastructure.database.models.base import TenantModel


class RegistroAuditoriaModel(TenantModel):
    __tablename__ = "auditoria"

    usuario_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    usuario_email = Column(String(255), nullable=False)
    modulo = Column(String(50), nullable=False, index=True)
    acao = Column(String(20), nullable=False)
    entidade_id = Column(String(100), nullable=False, index=True)
    descricao = Column(String(500), nullable=False)
    dados_anteriores = Column(JSONB)
    dados_novos = Column(JSONB)
