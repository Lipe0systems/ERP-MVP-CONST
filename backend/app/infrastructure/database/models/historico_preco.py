"""Modelo ORM: HistoricoPrecosEstoque. Camada: Infrastructure."""
from sqlalchemy import Column, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.infrastructure.database.models.base import BaseModel


class HistoricoPrecoEstoqueModel(BaseModel):
    __tablename__ = "historico_preco_estoque"

    empresa_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    produto = Column(String(255), nullable=False, index=True)
    quantidade = Column(Numeric(14, 3), nullable=False)
    valor_unitario = Column(Numeric(14, 2), nullable=False)
    origem = Column(String(50), nullable=False, default="compra")
    referencia_id = Column(PGUUID(as_uuid=True))
