"""Schemas de entrada/saída para Fornecedores. Camada: Presentation."""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.validators import is_valid_cpf_cnpj, only_digits


class FornecedorCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    # max_length=18: cabe tanto os dígitos puros (14) quanto o formato
    # pontuado de CNPJ (18 caracteres: 00.000.000/0000-00) — o validador
    # abaixo aceita os dois formatos e sempre GRAVA só os dígitos.
    # Antes era max_length=14 sem validação nenhuma de dígito verificador,
    # diferente do módulo Clientes — este documento estava desalinhado.
    documento: str | None = Field(None, max_length=18)
    email: str | None = Field(None, max_length=255)
    telefone: str | None = Field(None, max_length=20)
    endereco: str | None = Field(None, max_length=500)
    observacoes: str | None = None

    @field_validator("documento")
    @classmethod
    def documento_valido(cls, v: str | None) -> str | None:
        # Documento é OPCIONAL em Fornecedores (diferente de Clientes, onde
        # é obrigatório) — só valida de verdade quando algo foi preenchido.
        if not v or not v.strip():
            return None
        digits = only_digits(v)
        if len(digits) not in (11, 14):
            raise ValueError("Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos).")
        if not is_valid_cpf_cnpj(digits):
            tipo = "CPF" if len(digits) == 11 else "CNPJ"
            raise ValueError(f"{tipo} inválido. Verifique os dígitos verificadores.")
        return digits


class FornecedorUpdate(FornecedorCreate):
    pass


class FornecedorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
