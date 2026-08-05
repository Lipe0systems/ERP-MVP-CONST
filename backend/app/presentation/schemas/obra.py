"""
Schemas Pydantic (contratos de entrada/saída da API) do módulo Obras.
Camada: Presentation.
"""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.domain.entities.obra import ObraStatus


class ObraBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    cliente_id: UUID
    endereco: str | None = Field(None, max_length=500)
    responsavel: str | None = Field(None, max_length=255)
    data_inicio: date | None = None
    data_previsao: date | None = None
    status: ObraStatus = ObraStatus.PLANEJAMENTO
    valor_previsto: float | None = Field(None, ge=0)
    valor_realizado: float | None = Field(None, ge=0)

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Nome não pode ser vazio.")
        return v.strip()

    @model_validator(mode="after")
    def previsao_apos_inicio(self) -> "ObraBase":
        if self.data_inicio and self.data_previsao and self.data_previsao < self.data_inicio:
            raise ValueError("A data de previsão não pode ser anterior à data de início.")
        return self


class ObraCreate(ObraBase):
    pass


class ObraUpdate(ObraBase):
    pass


class ObraOut(ObraBase):
    id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class ObraListItemOut(ObraOut):
    cliente_nome: str


class ObraListOut(BaseModel):
    items: list[ObraListItemOut]
    total: int
    page: int
    page_size: int
