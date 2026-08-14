"""
Entidades de domínio: Orcamento e OrcamentoItem.
Um Orcamento é vinculado a um Cliente (obrigatório) e, opcionalmente, a uma Obra.
Cada OrcamentoItem pode estar vinculado a um produto do Estoque (baixa real na
aprovação) ou ser texto livre (mão de obra, serviços etc.).
Camada: Domain.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class StatusOrcamento(str, Enum):
    RASCUNHO = "rascunho"
    APROVADO = "aprovado"
    RECUSADO = "recusado"
    CANCELADO = "cancelado"  # ex-aprovado que foi estornado


STATUS_ORCAMENTO_LABEL = {
    StatusOrcamento.RASCUNHO: "Rascunho",
    StatusOrcamento.APROVADO: "Aprovado",
    StatusOrcamento.RECUSADO: "Recusado",
    StatusOrcamento.CANCELADO: "Cancelado",
}


@dataclass
class OrcamentoItem:
    id: UUID
    orcamento_id: UUID
    descricao: str
    quantidade: float
    valor_unitario: float
    unidade: str | None = None
    estoque_id: UUID | None = None  # se vinculado ao Estoque → baixa na aprovação

    @property
    def valor_total(self) -> float:
        return round(self.quantidade * self.valor_unitario, 2)


@dataclass
class Orcamento:
    id: UUID
    empresa_id: UUID
    cliente_id: UUID
    numero: int  # sequencial por empresa, gerado automaticamente
    status: StatusOrcamento = StatusOrcamento.RASCUNHO
    obra_id: UUID | None = None
    validade: date | None = None
    observacoes: str | None = None
    condicoes_pagamento: str | None = None
    conta_receber_id: UUID | None = None  # gerada na aprovação
    itens: list[OrcamentoItem] = field(default_factory=list)
    criado_em: datetime = field(default_factory=datetime.utcnow)

    @property
    def valor_total(self) -> float:
        return round(sum(item.valor_total for item in self.itens), 2)
