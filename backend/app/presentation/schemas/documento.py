"""Schemas Pydantic do módulo Documentos. Camada: Presentation."""
from datetime import datetime
from urllib.parse import urlparse
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import get_settings


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

    @field_validator("arquivo_url")
    @classmethod
    def _validar_dominio_storage(cls, v: str) -> str:
        """
        Impede cadastrar um documento apontando para qualquer URL externa
        (ex.: um link de phishing disfarçado de "Contrato.pdf") — só aceita
        URLs do próprio bucket de Storage do Supabase deste projeto.
        """
        settings = get_settings()
        host_esperado = urlparse(settings.SUPABASE_URL).netloc
        parsed = urlparse(v)
        if parsed.scheme != "https" or parsed.netloc != host_esperado:
            raise ValueError("A URL do arquivo precisa apontar para o armazenamento do sistema.")
        return v


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
