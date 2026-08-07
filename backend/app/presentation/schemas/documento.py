"""Schemas Pydantic do módulo Documentos. Camada: Presentation."""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class DocumentoRegistrarIn(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    arquivo_url: str = Field(min_length=1, max_length=1000)
    arquivo_nome: str = Field(min_length=1, max_length=255)
    arquivo_tipo: str = Field(min_length=1, max_length=100)
    arquivo_tamanho: int = Field(gt=0)
    cliente_id: UUID | None = None
    obra_id: UUID | None = None
    orcamento_id: UUID | None = None
    descricao: str | None = None


class DocumentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    nome: str
    arquivo_url: str
    arquivo_nome: str
    arquivo_tipo: str
    arquivo_tamanho: int
    cliente_id: UUID | None
    obra_id: UUID | None
    orcamento_id: UUID | None
    descricao: str | None
    criado_em: datetime
