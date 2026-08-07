"""
Entidade de domínio: Cliente, sempre vinculado a uma Empresa (tenant).
Camada: Domain — regras de negócio puras, sem dependências externas.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from uuid import UUID


@dataclass
class Cliente:
    id: UUID
    empresa_id: UUID
    nome: str
    documento: str  # CPF ou CNPJ, apenas dígitos
    email: str | None = None
    telefone: str | None = None
    whatsapp: str | None = None
    rg: str | None = None
    sexo: str | None = None          # M / F / outro
    data_nascimento: date | None = None
    # Endereço separado por campos (CEP automático via ViaCEP)
    cep: str | None = None
    logradouro: str | None = None
    numero: str | None = None
    complemento: str | None = None
    bairro: str | None = None
    cidade: str | None = None
    estado: str | None = None
    # Legado: campo único de endereço (mantido para compatibilidade com V1)
    endereco: str | None = None
    observacoes: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)
