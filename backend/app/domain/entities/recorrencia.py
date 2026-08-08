"""
Entidade de domínio: RecorrenciaFinanceira.
Modelo de conta fixa (aluguel, água, luz) que gera Contas a Pagar ou a
Receber automaticamente todo mês, no mesmo dia de vencimento.
Camada: Domain.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class TipoRecorrencia(str, Enum):
    PAGAR = "pagar"
    RECEBER = "receber"


@dataclass
class RecorrenciaFinanceira:
    id: UUID
    empresa_id: UUID
    tipo: TipoRecorrencia
    descricao: str
    valor: float
    dia_vencimento: int          # 1-28 (evita problema com meses curtos)
    ativo: bool = True
    fornecedor: str | None = None       # só para tipo=pagar
    cliente_id: UUID | None = None      # só para tipo=receber
    obra_id: UUID | None = None
    categoria: str | None = None
    observacoes: str | None = None
    ultima_geracao: date | None = None  # último mês/ano já gerado (para não duplicar)
    criado_em: datetime = field(default_factory=datetime.utcnow)
