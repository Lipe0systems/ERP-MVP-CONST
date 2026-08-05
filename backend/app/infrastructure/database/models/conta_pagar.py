"""
Modelo ORM: ContaPagar, vinculada a uma Empresa e, opcionalmente, a uma Obra.
Camada: Infrastructure.
"""
from sqlalchemy import Column, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.domain.entities.financeiro import StatusConta
from app.infrastructure.database.models.base import TenantModel


class ContaPagarModel(TenantModel):
    __tablename__ = "contas_pagar"

    descricao = Column(String(255), nullable=False)
    valor = Column(Numeric(14, 2), nullable=False)
    data_vencimento = Column(Date, nullable=False, index=True)
    fornecedor = Column(String(255))
    # ondelete="RESTRICT": mantém o histórico financeiro íntegro — não é
    # possível excluir uma Obra que possua lançamentos vinculados.
    obra_id = Column(PGUUID(as_uuid=True), ForeignKey("obras.id", ondelete="RESTRICT"), index=True)
    categoria = Column(String(100))
    data_pagamento = Column(Date)
    status = Column(String(20), nullable=False, default=StatusConta.PENDENTE.value, index=True)
    observacoes = Column(Text)
