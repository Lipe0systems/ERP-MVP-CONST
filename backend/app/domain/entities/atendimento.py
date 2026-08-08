"""
Entidade de domínio: Atendimento de Obra.
Cada atendimento é vinculado a um Cliente e, opcionalmente, a uma Obra.
Camada: Domain.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, datetime, time
from enum import Enum
from uuid import UUID


class TipoAtendimento(str, Enum):
    VISITA = "visita"
    ENTREGA = "entrega"
    VISTORIA = "vistoria"
    REUNIAO = "reuniao"
    OUTRO = "outro"


class StatusAtendimento(str, Enum):
    AGENDADO = "agendado"
    REALIZADO = "realizado"
    CANCELADO = "cancelado"


TIPO_ATENDIMENTO_LABEL = {
    TipoAtendimento.VISITA: "Visita",
    TipoAtendimento.ENTREGA: "Entrega",
    TipoAtendimento.VISTORIA: "Vistoria",
    TipoAtendimento.REUNIAO: "Reunião",
    TipoAtendimento.OUTRO: "Outro",
}

STATUS_ATENDIMENTO_LABEL = {
    StatusAtendimento.AGENDADO: "Agendado",
    StatusAtendimento.REALIZADO: "Realizado",
    StatusAtendimento.CANCELADO: "Cancelado",
}


@dataclass
class Atendimento:
    id: UUID
    empresa_id: UUID
    cliente_id: UUID
    tipo: TipoAtendimento
    status: StatusAtendimento
    data: date
    hora: time | None = None
    obra_id: UUID | None = None
    responsavel: str | None = None
    descricao: str | None = None
    checklist: list[str] = field(default_factory=list)   # itens do checklist
    checklist_ok: list[str] = field(default_factory=list) # itens marcados como OK
    fotos: list[str] = field(default_factory=list)        # URLs das fotos
    assinatura_url: str | None = None                     # URL da assinatura digital
    observacoes: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)
