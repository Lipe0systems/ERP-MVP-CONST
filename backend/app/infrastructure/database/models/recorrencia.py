"""Modelo ORM: RecorrenciaFinanceira. Camada: Infrastructure."""
from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.domain.entities.recorrencia import TipoRecorrencia
from app.infrastructure.database.models.base import TenantModel


class RecorrenciaFinanceiraModel(TenantModel):
    __tablename__ = "recorrencias_financeiras"

    tipo = Column(String(10), nullable=False)
    descricao = Column(String(255), nullable=False)
    valor = Column(Numeric(14, 2), nullable=False)
    dia_vencimento = Column(Integer, nullable=False)
    ativo = Column(Boolean, nullable=False, default=True)
    fornecedor = Column(String(255))
    cliente_id = Column(PGUUID(as_uuid=True), ForeignKey("clientes.id", ondelete="SET NULL"))
    obra_id = Column(PGUUID(as_uuid=True), ForeignKey("obras.id", ondelete="SET NULL"))
    categoria = Column(String(100))
    observacoes = Column(Text)
    ultima_geracao = Column(Date)
