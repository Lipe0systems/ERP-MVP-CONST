"""Modelo ORM: Funcionario. Camada: Infrastructure."""
from __future__ import annotations
from sqlalchemy import Boolean, Column, Date, Numeric, String, Text
from app.infrastructure.database.models.base import TenantModel


class FuncionarioModel(TenantModel):
    __tablename__ = "funcionarios"

    nome = Column(String(255), nullable=False)
    cpf = Column(String(11))
    cargo = Column(String(120))
    salario = Column(Numeric(14, 2), nullable=False, default=0)
    tipo_contratacao = Column(String(30), nullable=False, default="clt")
    data_admissao = Column(Date)
    data_demissao = Column(Date)
    telefone = Column(String(20))
    email = Column(String(255))
    ativo = Column(Boolean, nullable=False, default=True)
    observacoes = Column(Text)
