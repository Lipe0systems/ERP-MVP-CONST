"""
Modelo ORM: OrcamentoBaseObra — snapshot do valor previsto no momento em
que a obra é criada a partir de um orçamento aprovado.

Não confundir com o Orçamento comercial (tabela orcamentos), que continua
intacto como registro histórico de venda. Este é o "previsto" da obra em si,
usado para comparar com o realizado (Fluxo 2 / Fluxo 6 da V4).
Camada: Infrastructure.
"""
from __future__ import annotations
from sqlalchemy import Column, Numeric, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.infrastructure.database.models.base import TenantModel


class OrcamentoBaseObraModel(TenantModel):
    __tablename__ = "orcamentos_base_obra"
    __table_args__ = (UniqueConstraint("obra_id", name="uq_orcbase_obra"),)

    obra_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    orcamento_origem_id = Column(PGUUID(as_uuid=True))
    valor_previsto = Column(Numeric(14, 2), nullable=False, default=0)
    descricao = Column(Text)
