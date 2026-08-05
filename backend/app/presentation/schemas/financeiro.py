"""
Schemas Pydantic (contratos de entrada/saída da API) do módulo Financeiro.
Camada: Presentation.
"""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.domain.entities.financeiro import StatusConta


class ContaPagarBase(BaseModel):
    descricao: str = Field(..., min_length=2, max_length=255)
    valor: float = Field(..., gt=0)
    data_vencimento: date
    fornecedor: str | None = Field(None, max_length=255)
    obra_id: UUID | None = None
    categoria: str | None = Field(None, max_length=100)
    data_pagamento: date | None = None
    status: StatusConta = StatusConta.PENDENTE
    observacoes: str | None = None

    @field_validator("descricao")
    @classmethod
    def descricao_nao_vazia(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Descrição não pode ser vazia.")
        return v.strip()

    @model_validator(mode="after")
    def liquidacao_exige_data(self) -> "ContaPagarBase":
        if self.status == StatusConta.LIQUIDADO and self.data_pagamento is None:
            raise ValueError("Informe a data de pagamento para marcar a conta como paga.")
        return self


class ContaPagarCreate(ContaPagarBase):
    pass


class ContaPagarUpdate(ContaPagarBase):
    pass


class ContaPagarOut(ContaPagarBase):
    id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class ContaPagarListItemOut(ContaPagarOut):
    obra_nome: str | None = None


class ContaPagarListOut(BaseModel):
    items: list[ContaPagarListItemOut]
    total: int
    page: int
    page_size: int


class ContaReceberBase(BaseModel):
    descricao: str = Field(..., min_length=2, max_length=255)
    valor: float = Field(..., gt=0)
    data_vencimento: date
    cliente_id: UUID | None = None
    obra_id: UUID | None = None
    data_recebimento: date | None = None
    status: StatusConta = StatusConta.PENDENTE
    observacoes: str | None = None

    @field_validator("descricao")
    @classmethod
    def descricao_nao_vazia(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Descrição não pode ser vazia.")
        return v.strip()

    @model_validator(mode="after")
    def liquidacao_exige_data(self) -> "ContaReceberBase":
        if self.status == StatusConta.LIQUIDADO and self.data_recebimento is None:
            raise ValueError("Informe a data de recebimento para marcar a conta como recebida.")
        return self


class ContaReceberCreate(ContaReceberBase):
    pass


class ContaReceberUpdate(ContaReceberBase):
    pass


class ContaReceberOut(ContaReceberBase):
    id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class ContaReceberListItemOut(ContaReceberOut):
    cliente_nome: str | None = None
    obra_nome: str | None = None


class ContaReceberListOut(BaseModel):
    items: list[ContaReceberListItemOut]
    total: int
    page: int
    page_size: int


class FluxoCaixaMesOut(BaseModel):
    mes: str
    entrada: float
    saida: float


class FinanceiroResumoOut(BaseModel):
    total_a_pagar: float
    total_a_receber: float
    saldo_previsto: float
    fluxo_de_caixa: list[FluxoCaixaMesOut]
