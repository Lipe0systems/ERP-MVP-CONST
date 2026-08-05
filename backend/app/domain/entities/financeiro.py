"""
Entidades de domínio do módulo Financeiro: ContaPagar e ContaReceber,
sempre vinculadas a uma Empresa (tenant). Camada: Domain.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class StatusConta(str, Enum):
    PENDENTE = "pendente"
    LIQUIDADO = "liquidado"  # "pago" (Contas a Pagar) ou "recebido" (Contas a Receber)
    CANCELADO = "cancelado"


def esta_atrasada(status: StatusConta, data_vencimento: date, hoje: date) -> bool:
    """
    'Atrasado' é deliberadamente um estado CALCULADO, não armazenado: se
    fosse uma coluna de status, precisaria de um job periódico para não
    ficar desatualizado. Calculando na hora, o dado nunca fica obsoleto.
    """
    return status == StatusConta.PENDENTE and data_vencimento < hoje


@dataclass
class ContaPagar:
    id: UUID
    empresa_id: UUID
    descricao: str
    valor: float
    data_vencimento: date
    fornecedor: str | None = None
    obra_id: UUID | None = None
    categoria: str | None = None
    data_pagamento: date | None = None
    status: StatusConta = StatusConta.PENDENTE
    observacoes: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ContaReceber:
    id: UUID
    empresa_id: UUID
    descricao: str
    valor: float
    data_vencimento: date
    cliente_id: UUID | None = None
    obra_id: UUID | None = None
    data_recebimento: date | None = None
    status: StatusConta = StatusConta.PENDENTE
    observacoes: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)
