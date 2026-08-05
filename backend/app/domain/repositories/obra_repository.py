"""
Interface (porta) do repositório de Obras.
Camada: Domain — define o contrato que a Infrastructure deve implementar.
"""
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.obra import Obra, ObraStatus


class ObraRepository(ABC):
    @abstractmethod
    def list_with_cliente(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: ObraStatus | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        """
        Retorna (itens da página já com 'cliente_nome' anexado via JOIN,
        evitando N+1 queries, total de registros da empresa).
        """

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, obra_id: UUID) -> Obra | None:
        ...

    @abstractmethod
    def create(self, obra: Obra) -> Obra:
        ...

    @abstractmethod
    def update(self, obra: Obra) -> Obra:
        ...

    @abstractmethod
    def delete(self, empresa_id: UUID, obra_id: UUID) -> bool:
        ...

    @abstractmethod
    def contar_ativas_e_concluidas(self, empresa_id: UUID) -> tuple[int, int]:
        """Retorna (total de obras ativas, total de obras concluídas) — usado no Dashboard."""
