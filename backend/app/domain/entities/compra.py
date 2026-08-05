"""
Entidade de domínio: Compra, sempre vinculada a uma Empresa e, opcionalmente,
a uma Obra. Camada: Domain.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class StatusCompra(str, Enum):
    PENDENTE = "pendente"
    APROVADA = "aprovada"
    RECEBIDA = "recebida"
    CANCELADA = "cancelada"


@dataclass
class Compra:
    id: UUID
    empresa_id: UUID
    fornecedor: str
    produto: str
    quantidade: float
    valor_unitario: float
    data_compra: date
    unidade: str | None = None
    obra_id: UUID | None = None
    status: StatusCompra = StatusCompra.PENDENTE
    observacoes: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)

    @property
    def valor_total(self) -> float:
        """
        Deliberadamente NÃO armazenado — sempre calculado a partir de
        quantidade × valor_unitário, para nunca ficar dessincronizado se um
        dos dois for editado (mesmo princípio já aplicado a 'esta_atrasada'
        no módulo Financeiro).
        """
        return round(self.quantidade * self.valor_unitario, 2)
