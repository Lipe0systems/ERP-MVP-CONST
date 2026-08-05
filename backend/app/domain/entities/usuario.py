"""
Entidade de domínio: Usuário, sempre vinculado a uma Empresa (multi-tenant).
Camada: Domain.
"""
from dataclasses import dataclass
from uuid import UUID


@dataclass
class Usuario:
    id: UUID
    empresa_id: UUID
    nome: str
    email: str
    papel: str = "membro"  # ex.: admin, membro
    ativo: bool = True
