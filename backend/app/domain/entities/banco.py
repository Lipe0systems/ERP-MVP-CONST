"""
Entidades de domínio: ContaBancaria e LancamentoBancario.
Camada: Domain.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class TipoConta(str, Enum):
    CORRENTE = "corrente"
    POUPANCA = "poupanca"
    CAIXA = "caixa"       # dinheiro físico em caixa
    OUTRO = "outro"


class TipoLancamento(str, Enum):
    ENTRADA = "entrada"
    SAIDA = "saida"


@dataclass
class ContaBancaria:
    id: UUID
    empresa_id: UUID
    nome: str              # ex.: "Bradesco Conta Principal"
    banco: str | None      # ex.: "Bradesco", "Itaú"
    agencia: str | None
    numero_conta: str | None
    tipo: TipoConta
    saldo_inicial: float = 0.0
    ativo: bool = True
    observacoes: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)


@dataclass
class LancamentoBancario:
    id: UUID
    empresa_id: UUID
    conta_id: UUID
    tipo: TipoLancamento
    valor: float
    descricao: str
    data: date
    categoria: str | None = None
    referencia: str | None = None   # ex.: número de nota, orçamento
    criado_em: datetime = field(default_factory=datetime.utcnow)
