"""Modelos ORM: ContaBancariaModel e LancamentoBancarioModel. Camada: Infrastructure."""
from sqlalchemy import Boolean, Column, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.domain.entities.banco import TipoConta, TipoLancamento
from app.infrastructure.database.models.base import BaseModel, TenantModel


class ContaBancariaModel(TenantModel):
    __tablename__ = "contas_bancarias"

    nome = Column(String(255), nullable=False)
    banco = Column(String(100))
    agencia = Column(String(20))
    numero_conta = Column(String(30))
    tipo = Column(String(20), nullable=False, default=TipoConta.CORRENTE.value)
    saldo_inicial = Column(Numeric(14, 2), nullable=False, default=0)
    ativo = Column(Boolean, nullable=False, default=True)
    observacoes = Column(Text)


class LancamentoBancarioModel(BaseModel):
    __tablename__ = "lancamentos_bancarios"

    empresa_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    conta_id = Column(
        PGUUID(as_uuid=True),
        ForeignKey("contas_bancarias.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    tipo = Column(String(10), nullable=False)
    valor = Column(Numeric(14, 2), nullable=False)
    descricao = Column(String(255), nullable=False)
    data = Column(Date, nullable=False)
    categoria = Column(String(100))
    referencia = Column(String(100))
