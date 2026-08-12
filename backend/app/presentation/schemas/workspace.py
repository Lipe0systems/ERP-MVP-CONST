"""Schemas do Workspace Comercial. Camada: Presentation."""
from __future__ import annotations
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

FASES_PROCESSO = ("cliente", "orcamento", "proposta", "venda", "obra", "concluido")


class ProcessoComercialCreate(BaseModel):
    nome: str | None = None
    cliente_id: UUID | None = None  # se já tiver cliente escolhido de cara


class ProcessoComercialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    nome: str | None
    cliente_id: UUID | None
    orcamento_id: UUID | None
    venda_id: UUID | None
    obra_id: UUID | None
    fase: str
    criado_em: datetime
    # Enriquecido para a UI não precisar buscar em outro endpoint:
    cliente_nome: str | None = None
    orcamento_numero: int | None = None
    orcamento_status: str | None = None
    orcamento_valor_total: float | None = None
    venda_numero: int | None = None
    obra_nome: str | None = None
