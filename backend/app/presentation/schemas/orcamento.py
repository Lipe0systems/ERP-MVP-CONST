"""
Schemas de entrada/saída para o módulo Orçamentos.
Camada: Presentation.
"""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, computed_field

from app.domain.entities.orcamento import StatusOrcamento


# --- Itens ---

class OrcamentoItemIn(BaseModel):
    descricao: str = Field(min_length=1, max_length=255)
    quantidade: float = Field(gt=0)
    valor_unitario: float = Field(ge=0)
    unidade: str | None = Field(None, max_length=20)
    estoque_id: UUID | None = None


class OrcamentoItemOut(BaseModel):
    id: UUID
    descricao: str
    quantidade: float
    valor_unitario: float
    unidade: str | None
    estoque_id: UUID | None

    @computed_field
    @property
    def valor_total(self) -> float:
        return round(self.quantidade * self.valor_unitario, 2)


# --- Orçamento ---

class OrcamentoCreateIn(BaseModel):
    cliente_id: UUID
    obra_id: UUID | None = None
    validade: date | None = None
    observacoes: str | None = None
    itens: list[OrcamentoItemIn] = Field(min_length=1)


class OrcamentoUpdateIn(BaseModel):
    cliente_id: UUID
    obra_id: UUID | None = None
    validade: date | None = None
    observacoes: str | None = None
    itens: list[OrcamentoItemIn] = Field(min_length=1)


class OrcamentoOut(BaseModel):
    id: UUID
    numero: int
    cliente_id: UUID
    obra_id: UUID | None
    status: StatusOrcamento
    validade: date | None
    observacoes: str | None
    conta_receber_id: UUID | None
    itens: list[OrcamentoItemOut]
    criado_em: datetime

    @computed_field
    @property
    def valor_total(self) -> float:
        return round(sum(i.valor_total for i in self.itens), 2)


class OrcamentoListItemOut(BaseModel):
    """Versão resumida para a listagem (sem itens detalhados)."""
    id: UUID
    numero: int
    cliente_id: UUID
    cliente_nome: str
    obra_id: UUID | None
    obra_nome: str | None
    status: str
    validade: date | None
    valor_total: float
    qtd_itens: int
    conta_receber_id: UUID | None
    observacoes: str | None
    criado_em: datetime


class OrcamentoListOut(BaseModel):
    items: list[OrcamentoListItemOut]
    total: int
    page: int
    page_size: int
