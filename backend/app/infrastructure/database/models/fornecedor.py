"""Modelo ORM: Fornecedor. Camada: Infrastructure."""
from sqlalchemy import Column, String, Text
from app.infrastructure.database.models.base import TenantModel


class FornecedorModel(TenantModel):
    __tablename__ = "fornecedores"

    nome = Column(String(255), nullable=False)
    documento = Column(String(14))
    email = Column(String(255))
    telefone = Column(String(20))
    endereco = Column(String(500))
    observacoes = Column(Text)
