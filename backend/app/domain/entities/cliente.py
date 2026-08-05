"""
Entidade de domínio: Cliente, sempre vinculado a uma Empresa (tenant).
Camada: Domain — regras de negócio puras, sem dependências externas.
"""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Cliente:
    id: UUID
    empresa_id: UUID
    nome: str
    documento: str  # CPF ou CNPJ, apenas dígitos
    email: str | None = None
    telefone: str | None = None
    endereco: str | None = None
    observacoes: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)
