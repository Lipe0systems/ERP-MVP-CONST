"""Schemas Pydantic do módulo Bancário. Camada: Presentation."""
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.domain.entities.banco import TipoConta, TipoLancamento


class ContaBancariaIn(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    banco: str | None = Field(None, max_length=100)
    agencia: str | None = Field(None, max_length=20)
    numero_conta: str | None = Field(None, max_length=30)
    tipo: TipoConta = TipoConta.CORRENTE
    saldo_inicial: float = 0.0
    observacoes: str | None = None


class ContaBancariaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    nome: str
    banco: str | None
    agencia: str | None
    numero_conta: str | None
    tipo: TipoConta
    saldo_inicial: float
    saldo_atual: float = 0.0
    ativo: bool
    observacoes: str | None
    criado_em: datetime


class LancamentoBancarioIn(BaseModel):
    conta_id: UUID
    tipo: TipoLancamento
    valor: float = Field(gt=0)
    descricao: str = Field(min_length=1, max_length=255)
    data: date
    categoria: str | None = Field(None, max_length=100)
    referencia: str | None = Field(None, max_length=100)


class LancamentoBancarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    conta_id: UUID
    tipo: TipoLancamento
    valor: float
    descricao: str
    data: date
    categoria: str | None
    referencia: str | None
    criado_em: datetime


class LancamentosListOut(BaseModel):
    items: list[LancamentoBancarioOut]
    total: int
    page: int
    page_size: int
