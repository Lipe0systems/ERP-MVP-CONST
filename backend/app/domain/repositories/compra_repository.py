"""
Interface (porta) do repositório de Compras.
Camada: Domain.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.compra import Compra, StatusCompra


class CompraRepository(ABC):
    @abstractmethod
    def list_with_obra_nome(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: StatusCompra | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        """
        Retorna (itens da página já com 'obra_nome' anexado via LEFT JOIN —
        obra é opcional aqui — total de registros da empresa). O nome vem
        junto para que o formulário de edição sempre consiga pré-selecionar
        a obra vinculada no dropdown, mesmo fora da primeira página de
        opções carregada no <select> (lição da revisão da Fase 4).
        """

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, compra_id: UUID) -> Compra | None:
        ...

    @abstractmethod
    def create(self, compra: Compra) -> Compra:
        ...

    @abstractmethod
    def update(self, compra: Compra) -> Compra:
        ...

    @abstractmethod
    def delete(self, empresa_id: UUID, compra_id: UUID) -> bool:
        ...
