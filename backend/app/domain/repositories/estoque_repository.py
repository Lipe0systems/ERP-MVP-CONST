"""
Interface (porta) do repositório de Estoque.
Camada: Domain.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.estoque import ItemEstoque


class EstoqueRepository(ABC):
    @abstractmethod
    def list(
        self, empresa_id: UUID, search: str | None, page: int, page_size: int
    ) -> tuple[list[ItemEstoque], int]:
        ...

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, item_id: UUID) -> ItemEstoque | None:
        ...

    @abstractmethod
    def get_by_produto(self, empresa_id: UUID, produto: str) -> ItemEstoque | None:
        ...

    @abstractmethod
    def create(self, item: ItemEstoque) -> ItemEstoque:
        ...

    @abstractmethod
    def update(self, item: ItemEstoque) -> ItemEstoque:
        ...

    @abstractmethod
    def delete(self, empresa_id: UUID, item_id: UUID) -> bool:
        ...
