"""
Modelos ORM: Orcamento e OrcamentoItem.
Camada: Infrastructure.
"""
from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from app.domain.entities.orcamento import StatusOrcamento
from app.infrastructure.database.models.base import TenantModel, BaseModel


class OrcamentoModel(TenantModel):
    __tablename__ = "orcamentos"

    numero = Column(Integer, nullable=False)
    cliente_id = Column(
        PGUUID(as_uuid=True),
        ForeignKey("clientes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    obra_id = Column(
        PGUUID(as_uuid=True),
        ForeignKey("obras.id", ondelete="RESTRICT"),
        index=True,
    )
    status = Column(
        String(20), nullable=False, default=StatusOrcamento.RASCUNHO.value, index=True
    )
    validade = Column(Date)
    observacoes = Column(Text)
    condicoes_pagamento = Column(Text)
    conta_receber_id = Column(
        PGUUID(as_uuid=True),
        ForeignKey("contas_receber.id", ondelete="SET NULL"),
    )

    itens = relationship(
        "OrcamentoItemModel",
        cascade="all, delete-orphan",
        lazy="joined",
        order_by="OrcamentoItemModel.criado_em",
    )


class OrcamentoItemModel(BaseModel):
    __tablename__ = "orcamento_itens"

    orcamento_id = Column(
        PGUUID(as_uuid=True),
        ForeignKey("orcamentos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    descricao = Column(String(255), nullable=False)
    quantidade = Column(Numeric(14, 3), nullable=False)
    unidade = Column(String(20))
    valor_unitario = Column(Numeric(14, 2), nullable=False)
    estoque_id = Column(
        PGUUID(as_uuid=True),
        ForeignKey("estoque.id", ondelete="SET NULL"),
    )
