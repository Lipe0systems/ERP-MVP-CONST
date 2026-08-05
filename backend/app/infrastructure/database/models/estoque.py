"""
Modelo ORM: ItemEstoque, vinculado a uma Empresa (multi-tenant).
Camada: Infrastructure.
"""
from sqlalchemy import Column, Numeric, String, Text, UniqueConstraint

from app.infrastructure.database.models.base import TenantModel


class ItemEstoqueModel(TenantModel):
    __tablename__ = "estoque"
    __table_args__ = (
        # Um produto = uma linha de estoque por empresa (evita registros
        # duplicados do mesmo material) — mesma ideia do CPF/CNPJ em Cliente.
        UniqueConstraint("empresa_id", "produto", name="uq_estoque_empresa_produto"),
    )

    produto = Column(String(255), nullable=False)
    quantidade = Column(Numeric(14, 3), nullable=False, default=0)
    unidade = Column(String(20))
    valor_medio = Column(Numeric(14, 2), nullable=False, default=0)
    observacoes = Column(Text)
