"""Schemas Pydantic do módulo Recorrência Financeira. Camada: Presentation."""
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.domain.entities.recorrencia import TipoRecorrencia


class RecorrenciaCreateIn(BaseModel):
    tipo: TipoRecorrencia
    descricao: str = Field(min_length=1, max_length=255)
    valor: float = Field(gt=0)
    dia_vencimento: int = Field(ge=1, le=28)
    fornecedor: str | None = Field(None, max_length=255)
    cliente_id: UUID | None = None
    obra_id: UUID | None = None
    categoria: str | None = Field(None, max_length=100)
    observacoes: str | None = None
    gerar_mes_atual: bool = True


class RecorrenciaUpdateIn(BaseModel):
    descricao: str = Field(min_length=1, max_length=255)
    valor: float = Field(gt=0)
    dia_vencimento: int = Field(ge=1, le=28)
    ativo: bool = True
    fornecedor: str | None = Field(None, max_length=255)
    cliente_id: UUID | None = None
    obra_id: UUID | None = None
    categoria: str | None = Field(None, max_length=100)
    observacoes: str | None = None


class RecorrenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tipo: TipoRecorrencia
    descricao: str
    valor: float
    dia_vencimento: int
    ativo: bool
    fornecedor: str | None
    cliente_id: UUID | None
    obra_id: UUID | None
    categoria: str | None
    observacoes: str | None
    ultima_geracao: date | None
    criado_em: datetime
