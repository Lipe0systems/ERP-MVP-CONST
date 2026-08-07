"""Schemas de entrada/saída para Fornecedores. Camada: Presentation."""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class FornecedorCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    documento: str | None = Field(None, max_length=14)
    email: str | None = Field(None, max_length=255)
    telefone: str | None = Field(None, max_length=20)
    endereco: str | None = Field(None, max_length=500)
    observacoes: str | None = None


class FornecedorUpdate(FornecedorCreate):
    pass


class FornecedorOut(BaseModel):
    id: UUID
    nome: str
    documento: str | None
    email: str | None
    telefone: str | None
    endereco: str | None
    observacoes: str | None
    criado_em: datetime


class FornecedorListOut(BaseModel):
    items: list[FornecedorOut]
    total: int
    page: int
    page_size: int
