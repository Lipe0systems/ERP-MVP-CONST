"""
Entidade de domínio: Ordem de Serviço.
Camada: Domain — regras de negócio puras, sem dependências externas.

Independente de Obra de propósito (decisão do usuário): cobre tanto
serviços vinculados a uma obra maior quanto atendimentos avulsos.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class StatusOrdemServico(str, Enum):
    PENDENTE = "pendente"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


@dataclass
class OrdemServico:
    id: UUID
    empresa_id: UUID
    numero: int  # sequencial por empresa, gerado automaticamente
    titulo: str
    descricao: str | None = None
    cliente_id: UUID | None = None
    obra_id: UUID | None = None
    instalador_id: UUID | None = None
    status: StatusOrdemServico = StatusOrdemServico.PENDENTE
    endereco: str | None = None
    data_agendada: date | None = None
    foto_conclusao_url: str | None = None
    observacoes_conclusao: str | None = None
    concluido_em: datetime | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)
