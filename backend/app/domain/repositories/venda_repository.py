from __future__ import annotations
"""Interface do repositório de Vendas. Camada: Domain."""
from abc import ABC, abstractmethod
from uuid import UUID
from app.domain.entities.venda import StatusVenda, Venda


class VendaRepository(ABC):
    @abstractmethod
    def list(self, empresa_id: UUID, status: StatusVenda | None, page: int, page_size: int) -> tuple[list[dict], int]: ...

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, venda_id: UUID) -> Venda | None: ...

    @abstractmethod
    def next_numero(self, empresa_id: UUID) -> int: ...

    @abstractmethod
    def create(self, venda: Venda) -> Venda: ...

    @abstractmethod
    def update(self, venda: Venda) -> Venda: ...
