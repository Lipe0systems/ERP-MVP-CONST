"""Modelos ORM: VendaModel e ParcelaVendaModel. Camada: Infrastructure."""
from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from app.domain.entities.venda import FormaPagamento, StatusVenda
from app.infrastructure.database.models.base import BaseModel, TenantModel


class VendaModel(TenantModel):
    __tablename__ = "vendas"

    numero = Column(Integer, nullable=False)
    cliente_id = Column(PGUUID(as_uuid=True), ForeignKey("clientes.id", ondelete="RESTRICT"), nullable=False, index=True)
    orcamento_id = Column(PGUUID(as_uuid=True), ForeignKey("orcamentos.id", ondelete="SET NULL"))
    obra_id = Column(PGUUID(as_uuid=True), ForeignKey("obras.id", ondelete="RESTRICT"))
    status = Column(String(20), nullable=False, default=StatusVenda.ABERTA.value, index=True)
    forma_pagamento = Column(String(20), nullable=False, default=FormaPagamento.AVISTA.value)
    valor_total = Column(Numeric(14, 2), nullable=False, default=0)
    desconto = Column(Numeric(14, 2), nullable=False, default=0)
    observacoes = Column(Text)

    parcelas = relationship("ParcelaVendaModel", cascade="all, delete-orphan", lazy="joined",
                            order_by="ParcelaVendaModel.numero")


class ParcelaVendaModel(BaseModel):
    __tablename__ = "parcelas_venda"

    venda_id = Column(PGUUID(as_uuid=True), ForeignKey("vendas.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(PGUUID(as_uuid=True), nullable=False)
    numero = Column(Integer, nullable=False)
    valor = Column(Numeric(14, 2), nullable=False)
    vencimento = Column(Date, nullable=False)
    conta_receber_id = Column(PGUUID(as_uuid=True), ForeignKey("contas_receber.id", ondelete="SET NULL"))
