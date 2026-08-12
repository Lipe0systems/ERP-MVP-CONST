"""
Modelo ORM: MovimentacaoEstoque — rastreabilidade de entrada, transferência,
consumo e ajuste de itens do estoque (Fluxo 4 da V4).
Camada: Infrastructure.
"""
from __future__ import annotations
from sqlalchemy import Column, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.infrastructure.database.models.base import TenantModel


class MovimentacaoEstoqueModel(TenantModel):
    __tablename__ = "movimentacoes_estoque"

    estoque_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    produto = Column(String(255), nullable=False)
    tipo = Column(String(20), nullable=False)  # entrada, transferencia, consumo, ajuste
    quantidade = Column(Numeric(14, 3), nullable=False)
    origem = Column(String(50))
    destino = Column(String(50))
    obra_id = Column(PGUUID(as_uuid=True), index=True)
    referencia_id = Column(PGUUID(as_uuid=True))
    usuario_id = Column(PGUUID(as_uuid=True))
    observacao = Column(Text)
