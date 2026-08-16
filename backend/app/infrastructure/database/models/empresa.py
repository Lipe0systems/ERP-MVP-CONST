"""
Modelo ORM: Empresa (tenant raiz do sistema).
Camada: Infrastructure.
"""
from sqlalchemy import Boolean, Column, String

from app.infrastructure.database.models.base import BaseModel


class EmpresaModel(BaseModel):
    __tablename__ = "empresas"

    nome = Column(String(255), nullable=False)
    cnpj = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255))
    telefone = Column(String(20))
    logo_path = Column(String(500))  # caminho no Storage, não a URL (ver schema_logo_empresa.sql)
    ativo = Column(Boolean, default=True, nullable=False)
