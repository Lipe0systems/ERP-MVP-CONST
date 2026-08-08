from __future__ import annotations
"""Interface (porta) do repositório de Fornecedores. Camada: Domain."""
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.fornecedor import Fornecedor


class FornecedorRepository(ABC):
    @abstractmethod
    def list(self, empresa_id: UUID, search: str | None, page: int, page_size: int) -> tuple[list[Fornecedor], int]: ...

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, fornecedor_id: UUID) -> Fornecedor | None: ...

    @abstractmethod
    def create(self, fornecedor: Fornecedor) -> Fornecedor: ...

    @abstractmethod
    def update(self, fornecedor: Fornecedor) -> Fornecedor: ...

    @abstractmethod
    def delete(self, empresa_id: UUID, fornecedor_id: UUID) -> bool: ...
