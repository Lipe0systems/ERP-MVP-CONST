"""
Interface (porta) do repositório de Diário de Obra.
Camada: Domain.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.diario_obra import RegistroDiario


class DiarioObraRepository(ABC):
    @abstractmethod
    def list_with_obra_nome(
        self,
        empresa_id: UUID,
        obra_id: UUID | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        """
        Retorna (itens da página já com 'obra_nome' anexado via JOIN — Obra é
        obrigatória aqui, então é um INNER JOIN —, total de registros da
        empresa), ordenados da data mais recente para a mais antiga.
        """

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, registro_id: UUID) -> RegistroDiario | None:
        ...

    @abstractmethod
    def create(self, registro: RegistroDiario) -> RegistroDiario:
        ...

    @abstractmethod
    def update(self, registro: RegistroDiario) -> RegistroDiario:
        ...

    @abstractmethod
    def delete(self, empresa_id: UUID, registro_id: UUID) -> bool:
        ...
