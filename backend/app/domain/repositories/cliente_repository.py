"""
Interface (porta) do repositório de Clientes.
Camada: Domain — define o contrato que a Infrastructure deve implementar,
mantendo o domínio independente de SQLAlchemy/Postgres.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.cliente import Cliente


class ClienteRepository(ABC):
    @abstractmethod
    def list(
        self, empresa_id: UUID, search: str | None, page: int, page_size: int
    ) -> tuple[list[Cliente], int]:
        """Retorna (itens da página, total de registros da empresa)."""

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, cliente_id: UUID) -> Cliente | None:
        ...

    @abstractmethod
    def get_by_documento(self, empresa_id: UUID, documento: str) -> Cliente | None:
        ...

    @abstractmethod
    def create(self, cliente: Cliente) -> Cliente:
        ...

    @abstractmethod
    def update(self, cliente: Cliente) -> Cliente:
        ...

    @abstractmethod
    def delete(self, empresa_id: UUID, cliente_id: UUID) -> bool:
        ...

    @abstractmethod
    def contar(self, empresa_id: UUID) -> int:
        """Total de clientes da empresa — usado no Dashboard."""
