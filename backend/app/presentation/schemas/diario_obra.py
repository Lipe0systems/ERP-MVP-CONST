"""
Schemas Pydantic (contratos de entrada/saída da API) do módulo Diário de Obra.
Camada: Presentation.
"""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.domain.entities.diario_obra import MAX_FOTOS_POR_REGISTRO, ClimaObra


class RegistroDiarioBase(BaseModel):
    obra_id: UUID
    data: date
    observacoes: str = Field(..., min_length=2)
    clima: ClimaObra | None = None
    fotos: list[str] = Field(default_factory=list)

    @field_validator("observacoes")
    @classmethod
    def observacoes_nao_vazia(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Observações não podem ser vazias.")
        return v.strip()

    @field_validator("fotos")
    @classmethod
    def fotos_validas(cls, v: list[str]) -> list[str]:
        if len(v) > MAX_FOTOS_POR_REGISTRO:
            raise ValueError(f"No máximo {MAX_FOTOS_POR_REGISTRO} fotos por registro.")
        for url in v:
            if not url.startswith("https://") and not url.startswith("http://"):
                raise ValueError("Cada foto deve ser uma URL válida (retornada pelo Supabase Storage).")
        return v


class RegistroDiarioCreate(RegistroDiarioBase):
    pass


class RegistroDiarioUpdate(RegistroDiarioBase):
    pass


class RegistroDiarioOut(RegistroDiarioBase):
    id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class RegistroDiarioListItemOut(RegistroDiarioOut):
    obra_nome: str


class RegistroDiarioListOut(BaseModel):
    items: list[RegistroDiarioListItemOut]
    total: int
    page: int
    page_size: int
