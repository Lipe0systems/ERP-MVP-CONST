"""
Entidade de domínio: Fornecedor, sempre vinculado a uma Empresa (tenant).
Camada: Domain.
"""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Fornecedor:
    id: UUID
    empresa_id: UUID
    nome: str
    documento: str | None = None  # CNPJ ou CPF, apenas dígitos
    email: str | None = None
    telefone: str | None = None
    endereco: str | None = None
    observacoes: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)
