"""
Modelo ORM: Cliente, sempre vinculado a uma Empresa (multi-tenant).
Camada: Infrastructure.
"""
from sqlalchemy import Column, String, Text, UniqueConstraint

from app.infrastructure.database.models.base import TenantModel


class ClienteModel(TenantModel):
    __tablename__ = "clientes"
    __table_args__ = (
        # Documento único por empresa (duas empresas diferentes podem ter
        # clientes com o mesmo CPF/CNPJ, mas a mesma empresa não pode
        # cadastrar o mesmo documento duas vezes).
        UniqueConstraint("empresa_id", "documento", name="uq_clientes_empresa_documento"),
    )

    nome = Column(String(255), nullable=False)
    documento = Column(String(14), nullable=False, index=True)  # apenas dígitos (CPF ou CNPJ)
    email = Column(String(255))
    telefone = Column(String(20))
    endereco = Column(String(500))
    observacoes = Column(Text)
