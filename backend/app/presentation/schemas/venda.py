"""Schemas Pydantic do módulo Vendas. Camada: Presentation."""
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.domain.entities.venda import FormaPagamento, StatusVenda


class VendaDeOrcamentoIn(BaseModel):
    orcamento_id: UUID
    forma_pagamento: FormaPagamento = FormaPagamento.AVISTA
    num_parcelas: int = Field(1, ge=1, le=60)
    dias_primeiro_vencimento: int = Field(30, ge=1, le=365)
    desconto: float = Field(0.0, ge=0)
    observacoes: str | None = None


class VendaCreateIn(BaseModel):
    cliente_id: UUID
    obra_id: UUID | None = None
    valor_total: float = Field(gt=0)
    forma_pagamento: FormaPagamento = FormaPagamento.AVISTA
    num_parcelas: int = Field(1, ge=1, le=60)
    dias_primeiro_vencimento: int = Field(30, ge=1, le=365)
    desconto: float = Field(0.0, ge=0)
    observacoes: str | None = None


class ParcelaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; numero: int; valor: float; vencimento: date
    conta_receber_id: UUID | None


class VendaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; numero: int; cliente_id: UUID; orcamento_id: UUID | None
    obra_id: UUID | None; status: StatusVenda; forma_pagamento: FormaPagamento
    valor_total: float; desconto: float; valor_liquido: float
    observacoes: str | None; parcelas: list[ParcelaOut]; criado_em: datetime


class VendaListItemOut(BaseModel):
    id: UUID; numero: int; cliente_id: UUID; cliente_nome: str
    orcamento_id: UUID | None; obra_id: UUID | None; obra_nome: str | None
    status: str; forma_pagamento: str
    valor_total: float; desconto: float; valor_liquido: float
    num_parcelas: int; observacoes: str | None; criado_em: datetime


class VendaListOut(BaseModel):
    items: list[VendaListItemOut]; total: int; page: int; page_size: int
