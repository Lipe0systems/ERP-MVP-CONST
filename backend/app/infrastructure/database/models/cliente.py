"""
Modelo ORM: Cliente, sempre vinculado a uma Empresa (multi-tenant).
Camada: Infrastructure.
"""
from sqlalchemy import Column, Date, String, Text, UniqueConstraint

from app.infrastructure.database.models.base import TenantModel


class ClienteModel(TenantModel):
    __tablename__ = "clientes"
    __table_args__ = (
        UniqueConstraint("empresa_id", "documento", name="uq_clientes_empresa_documento"),
    )

    nome = Column(String(255), nullable=False)
    documento = Column(String(14), nullable=False, index=True)
    email = Column(String(255))
    telefone = Column(String(20))
    whatsapp = Column(String(20))
    rg = Column(String(20))
    sexo = Column(String(10))
    data_nascimento = Column(Date)
    # Campos de endereço estruturado (CEP automático)
    cep = Column(String(8))
    logradouro = Column(String(255))
    numero = Column(String(20))
    complemento = Column(String(100))
    bairro = Column(String(100))
    cidade = Column(String(100))
    estado = Column(String(2))
    # Legado: campo único de endereço
    endereco = Column(String(500))
    observacoes = Column(Text)
