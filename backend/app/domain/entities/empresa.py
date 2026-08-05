"""
Entidade de domínio: Empresa (tenant).
Camada: Domain — regras de negócio puras, sem dependências externas.
"""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Empresa:
    id: UUID
    nome: str
    cnpj: str
    email: str | None = None
    telefone: str | None = None
    ativo: bool = True
    criado_em: datetime = field(default_factory=datetime.utcnow)
