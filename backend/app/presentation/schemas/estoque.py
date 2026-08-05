"""
Schemas Pydantic (contratos de entrada/saída da API) do módulo Estoque.
Camada: Presentation.
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, computed_field, field_validator


class ItemEstoqueBase(BaseModel):
    produto: str = Field(..., min_length=2, max_length=255)
    quantidade: float = Field(..., ge=0)
    valor_medio: float = Field(..., ge=0)
    unidade: str | None = Field(None, max_length=20)
    observacoes: str | None = None

    @field_validator("produto")
    @classmethod
    def produto_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Produto não pode ser vazio.")
        return v.strip()


class ItemEstoqueCreate(ItemEstoqueBase):
    pass


class ItemEstoqueUpdate(ItemEstoqueBase):
    pass


class ItemEstoqueOut(ItemEstoqueBase):
    id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}

    @computed_field  # type: ignore[misc]
    @property
    def valor_total(self) -> float:
        """Nunca armazenado — sempre quantidade × valor_médio (ver ItemEstoque.valor_total)."""
        return round(self.quantidade * self.valor_medio, 2)


class ItemEstoqueListOut(BaseModel):
    items: list[ItemEstoqueOut]
    total: int
    page: int
    page_size: int
