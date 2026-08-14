"""Schemas de entrada/saída para o onboarding. Camada: Presentation."""
from pydantic import BaseModel, Field, field_validator


class OnboardingCreate(BaseModel):
    # Empresa
    empresa_nome: str = Field(min_length=2, max_length=255)
    empresa_cnpj: str = Field(min_length=14, max_length=18)
    empresa_email: str | None = Field(None, max_length=255)
    empresa_telefone: str | None = Field(None, max_length=20)
    empresa_endereco: str | None = Field(None, max_length=500)

    # Primeiro usuário admin
    admin_nome: str = Field(min_length=2, max_length=255)
    admin_email: str = Field(min_length=5, max_length=255)
    admin_senha: str = Field(min_length=8, max_length=100)

    @field_validator("empresa_cnpj")
    @classmethod
    def validar_cnpj(cls, v: str) -> str:
        digitos = "".join(c for c in v if c.isdigit())
        if len(digitos) != 14:
            raise ValueError("CNPJ deve conter 14 dígitos.")
        return v


class OnboardingOut(BaseModel):
    mensagem: str
    empresa_id: str
    access_token: str | None = None
    refresh_token: str | None = None


class EmpresaListItem(BaseModel):
    id: str
    nome: str
    cnpj: str
    email: str | None
    telefone: str | None
    ativo: bool
    qtd_usuarios: int
    criado_em: str


class AlternarAtivoIn(BaseModel):
    ativo: bool
