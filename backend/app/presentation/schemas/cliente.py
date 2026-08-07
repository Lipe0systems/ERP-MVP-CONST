"""
Schemas Pydantic (contratos de entrada/saída da API) do módulo Clientes.
Camada: Presentation.
"""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.validators import only_digits

SEXO_OPCOES = ("M", "F", "outro")


class ClienteBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    documento: str = Field(..., min_length=11, max_length=18, description="CPF ou CNPJ")
    email: EmailStr | None = None
    telefone: str | None = Field(None, max_length=20)
    whatsapp: str | None = Field(None, max_length=20)
    rg: str | None = Field(None, max_length=20)
    sexo: str | None = Field(None, description="M, F ou outro")
    data_nascimento: date | None = None
    # Endereço estruturado (CEP automático)
    cep: str | None = Field(None, max_length=8)
    logradouro: str | None = Field(None, max_length=255)
    numero: str | None = Field(None, max_length=20)
    complemento: str | None = Field(None, max_length=100)
    bairro: str | None = Field(None, max_length=100)
    cidade: str | None = Field(None, max_length=100)
    estado: str | None = Field(None, max_length=2)
    # Legado
    endereco: str | None = Field(None, max_length=500)
    observacoes: str | None = None

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Nome não pode ser vazio.")
        return v.strip()

    @field_validator("documento")
    @classmethod
    def documento_apenas_digitos_no_tamanho_certo(cls, v: str) -> str:
        digits = only_digits(v)
        if len(digits) not in (11, 14):
            raise ValueError("Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos).")
        return digits

    @field_validator("sexo")
    @classmethod
    def sexo_valido(cls, v: str | None) -> str | None:
        if v and v not in SEXO_OPCOES:
            raise ValueError(f"Sexo deve ser um de: {', '.join(SEXO_OPCOES)}")
        return v


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(ClienteBase):
    pass


class ClienteOut(ClienteBase):
    id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class ClienteListOut(BaseModel):
    items: list[ClienteOut]
    total: int
    page: int
    page_size: int
