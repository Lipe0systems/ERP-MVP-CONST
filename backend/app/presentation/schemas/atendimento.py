"""Schemas Pydantic do módulo Atendimentos. Camada: Presentation."""
from datetime import date, datetime, time
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.domain.entities.atendimento import StatusAtendimento, TipoAtendimento


class AtendimentoIn(BaseModel):
    cliente_id: UUID
    obra_id: UUID | None = None
    tipo: TipoAtendimento = TipoAtendimento.VISITA
    status: StatusAtendimento = StatusAtendimento.AGENDADO
    data: date
    hora: time | None = None
    responsavel: str | None = Field(None, max_length=255)
    descricao: str | None = None
    checklist: list[str] = Field(default_factory=list)
    checklist_ok: list[str] = Field(default_factory=list)
    fotos: list[str] = Field(default_factory=list)
    assinatura_url: str | None = None
    observacoes: str | None = None


class AtendimentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    cliente_id: UUID
    obra_id: UUID | None
    tipo: TipoAtendimento
    status: StatusAtendimento
    data: date
    hora: time | None
    responsavel: str | None
    descricao: str | None
    checklist: list[str]
    checklist_ok: list[str]
    fotos: list[str]
    assinatura_url: str | None
    observacoes: str | None
    criado_em: datetime


class AtendimentoListItemOut(BaseModel):
    id: UUID
    cliente_id: UUID
    cliente_nome: str
    obra_id: UUID | None
    obra_nome: str | None
    tipo: str
    status: str
    data: date
    hora: time | None
    responsavel: str | None
    descricao: str | None
    checklist: list[str]
    checklist_ok: list[str]
    fotos: list[str]
    criado_em: datetime


class AtendimentoListOut(BaseModel):
    items: list[AtendimentoListItemOut]
    total: int
    page: int
    page_size: int
