from __future__ import annotations
"""Interface do repositório de Atendimentos. Camada: Domain."""
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.atendimento import Atendimento, StatusAtendimento


class AtendimentoRepository(ABC):
    @abstractmethod
    def list(
        self, empresa_id: UUID, cliente_id: UUID | None,
        obra_id: UUID | None, status: StatusAtendimento | None,
        page: int, page_size: int,
    ) -> tuple[list[dict], int]: ...

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, atendimento_id: UUID) -> Atendimento | None: ...

    @abstractmethod
    def create(self, atendimento: Atendimento) -> Atendimento: ...

    @abstractmethod
    def update(self, atendimento: Atendimento) -> Atendimento: ...

    @abstractmethod
    def delete(self, empresa_id: UUID, atendimento_id: UUID) -> bool: ...
