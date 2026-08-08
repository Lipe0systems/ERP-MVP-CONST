"""
Entidades de domínio: Venda e ParcelaVenda.
Uma Venda é gerada a partir de um Orçamento aprovado (ou criada diretamente).
Cada parcela gera uma Conta a Receber automaticamente.
Camada: Domain.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class StatusVenda(str, Enum):
    ABERTA = "aberta"
    PAGA = "paga"
    CANCELADA = "cancelada"


class FormaPagamento(str, Enum):
    AVISTA = "avista"
    PARCELADO = "parcelado"
    BOLETO = "boleto"
    PIX = "pix"
    CARTAO = "cartao"
    OUTRO = "outro"


STATUS_VENDA_LABEL = {
    StatusVenda.ABERTA: "Em aberto",
    StatusVenda.PAGA: "Paga",
    StatusVenda.CANCELADA: "Cancelada",
}

FORMA_PAGAMENTO_LABEL = {
    FormaPagamento.AVISTA: "À vista",
    FormaPagamento.PARCELADO: "Parcelado",
    FormaPagamento.BOLETO: "Boleto",
    FormaPagamento.PIX: "PIX",
    FormaPagamento.CARTAO: "Cartão",
    FormaPagamento.OUTRO: "Outro",
}


@dataclass
class ParcelaVenda:
    id: UUID
    venda_id: UUID
    empresa_id: UUID
    numero: int             # 1, 2, 3...
    valor: float
    vencimento: date
    conta_receber_id: UUID | None = None  # gerada automaticamente
    criado_em: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Venda:
    id: UUID
    empresa_id: UUID
    numero: int             # sequencial por empresa
    cliente_id: UUID
    status: StatusVenda = StatusVenda.ABERTA
    forma_pagamento: FormaPagamento = FormaPagamento.AVISTA
    orcamento_id: UUID | None = None   # origem, se veio de orçamento
    obra_id: UUID | None = None
    valor_total: float = 0.0
    desconto: float = 0.0
    observacoes: str | None = None
    parcelas: list[ParcelaVenda] = field(default_factory=list)
    criado_em: datetime = field(default_factory=datetime.utcnow)

    @property
    def valor_liquido(self) -> float:
        return round(self.valor_total - self.desconto, 2)
