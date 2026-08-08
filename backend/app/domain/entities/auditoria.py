"""
Entidade de domínio: RegistroAuditoria.
Armazena quem fez o quê, quando e em qual módulo.
Camada: Domain — sem regras de negócio complexas, só estrutura de dados.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import UUID


class AcaoAuditoria(str, Enum):
    CRIOU = "criou"
    EDITOU = "editou"
    EXCLUIU = "excluiu"
    APROVOU = "aprovou"
    CANCELOU = "cancelou"
    RECUSOU = "recusou"
    RECEBEU = "recebeu"    # ex.: compra recebida


@dataclass
class RegistroAuditoria:
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    usuario_email: str
    modulo: str            # ex.: "orcamentos", "financeiro", "vendas"
    acao: AcaoAuditoria
    entidade_id: str       # UUID da entidade afetada (como str para flexibilidade)
    descricao: str         # texto legível ex.: "Orçamento #0042 aprovado"
    dados_anteriores: dict | None = None   # snapshot antes (para edições)
    dados_novos: dict | None = None        # snapshot depois
    criado_em: datetime = field(default_factory=datetime.utcnow)
