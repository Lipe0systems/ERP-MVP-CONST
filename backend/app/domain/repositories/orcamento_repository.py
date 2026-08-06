"""
Interface (porta) do repositório de Orçamentos.
Camada: Domain.
"""
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.orcamento import Orcamento, StatusOrcamento


class OrcamentoRepository(ABC):
    @abstractmethod
    def list_with_relacionamentos(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: StatusOrcamento | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        ...

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, orcamento_id: UUID) -> Orcamento | None:
        ...

    @abstractmethod
    def next_numero(self, empresa_id: UUID) -> int:
        ...

    @abstractmethod
    def create(self, orcamento: Orcamento) -> Orcamento:
        ...

    @abstractmethod
    def update(self, orcamento: Orcamento) -> Orcamento:
        ...

    @abstractmethod
    def delete(self, empresa_id: UUID, orcamento_id: UUID) -> bool:
        ...
