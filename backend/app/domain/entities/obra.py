"""
Entidade de domínio: Obra, sempre vinculada a uma Empresa e a um Cliente.
Camada: Domain — regras de negócio puras, sem dependências externas.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class ObraStatus(str, Enum):
    PLANEJAMENTO = "planejamento"
    EM_ANDAMENTO = "em_andamento"
    PAUSADA = "pausada"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


@dataclass
class Obra:
    id: UUID
    empresa_id: UUID
    nome: str
    cliente_id: UUID
    endereco: str | None = None
    responsavel: str | None = None
    data_inicio: date | None = None
    data_previsao: date | None = None
    status: ObraStatus = ObraStatus.PLANEJAMENTO
    valor_previsto: float | None = None
    valor_realizado: float | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)
