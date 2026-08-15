"""Schemas Pydantic do módulo Ordens de Serviço. Camada: Presentation."""
from __future__ import annotations
from datetime import date, datetime
from urllib.parse import urlparse
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

from app.core.config import get_settings
from app.domain.entities.ordem_servico import StatusOrdemServico


class OrdemServicoCreateIn(BaseModel):
    titulo: str = Field(min_length=1, max_length=255)
    descricao: str | None = None
    cliente_id: UUID | None = None
    obra_id: UUID | None = None
    instalador_id: UUID | None = None
    endereco: str | None = Field(None, max_length=500)
    data_agendada: date | None = None


class OrdemServicoUpdateIn(OrdemServicoCreateIn):
    status: StatusOrdemServico | None = None


class ConcluirOrdemServicoIn(BaseModel):
    foto_conclusao_url: str = Field(min_length=1, max_length=1000)
    observacoes: str | None = None

    @field_validator("foto_conclusao_url")
    @classmethod
    def _validar_dominio_storage(cls, v: str) -> str:
        """Mesma defesa usada em Documentos: só aceita URL do Storage do próprio projeto."""
        settings = get_settings()
        host_esperado = urlparse(settings.SUPABASE_URL).netloc
        parsed = urlparse(v)
        if parsed.scheme != "https" or parsed.netloc != host_esperado:
            raise ValueError("A URL da foto precisa apontar para o armazenamento do sistema.")
        return v


class OrdemServicoOut(BaseModel):
    id: UUID
    numero: int
    titulo: str
    descricao: str | None
    cliente_id: UUID | None
    cliente_nome: str | None = None
    obra_id: UUID | None
    obra_nome: str | None = None
    instalador_id: UUID | None
    instalador_nome: str | None = None
    status: StatusOrdemServico
    endereco: str | None
    data_agendada: date | None
    foto_conclusao_url: str | None
    concluido_em: datetime | None
    criado_em: datetime


class OrdemServicoListOut(BaseModel):
    items: list[OrdemServicoOut]
    total: int
    page: int
    page_size: int
