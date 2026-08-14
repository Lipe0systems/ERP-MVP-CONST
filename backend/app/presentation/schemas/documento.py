"""Schemas Pydantic do módulo Documentos. Camada: Presentation."""
from datetime import datetime
from urllib.parse import urlparse
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import get_settings

# Mesma lista e limite usados na validação do frontend
# (storage-documentos.ts) — o upload em si acontece direto do navegador
# pro Storage, então esta é a defesa em profundidade do lado do backend:
# mesmo que alguém chame POST /documentos diretamente (contornando a tela),
# não consegue registrar metadados fora do que é permitido.
TIPOS_ACEITOS = {
    "application/pdf",
    "image/jpeg", "image/png", "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
TAMANHO_MAXIMO_BYTES = 20 * 1024 * 1024  # 20MB


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

    @field_validator("arquivo_tipo")
    @classmethod
    def _validar_tipo(cls, v: str) -> str:
        if v not in TIPOS_ACEITOS:
            raise ValueError("Formato de arquivo não suportado.")
        return v

    @field_validator("arquivo_tamanho")
    @classmethod
    def _validar_tamanho(cls, v: int) -> int:
        if v > TAMANHO_MAXIMO_BYTES:
            raise ValueError(f"O arquivo deve ter no máximo {TAMANHO_MAXIMO_BYTES // (1024*1024)}MB.")
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
