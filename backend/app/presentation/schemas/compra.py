"""
Schemas Pydantic (contratos de entrada/saída da API) do módulo Compras.
Camada: Presentation.
"""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, computed_field, field_validator

from app.domain.entities.compra import StatusCompra


class CompraBase(BaseModel):
    fornecedor: str = Field(..., min_length=2, max_length=255)
    produto: str = Field(..., min_length=2, max_length=255)
    quantidade: float = Field(..., gt=0)
    valor_unitario: float = Field(..., gt=0)
    data_compra: date
    unidade: str | None = Field(None, max_length=20)
    obra_id: UUID | None = None
    status: StatusCompra = StatusCompra.PENDENTE
    observacoes: str | None = None

    @field_validator("fornecedor", "produto")
    @classmethod
    def texto_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Campo não pode ser vazio.")
        return v.strip()


class CompraCreate(CompraBase):
    pass


class CompraUpdate(CompraBase):
    pass


class CompraOut(CompraBase):
    id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}

    @computed_field  # type: ignore[misc]
    @property
    def valor_total(self) -> float:
        """Nunca armazenado — sempre quantidade × valor_unitário (ver Compra.valor_total)."""
        return round(self.quantidade * self.valor_unitario, 2)


class CompraListItemOut(CompraOut):
    obra_nome: str | None = None


class CompraListOut(BaseModel):
    items: list[CompraListItemOut]
    total: int
    page: int
    page_size: int
