"""Interfaces dos repositórios de banco. Camada: Domain."""
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.banco import ContaBancaria, LancamentoBancario


class ContaBancariaRepository(ABC):
    @abstractmethod
    def list(self, empresa_id: UUID) -> list[ContaBancaria]: ...

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, conta_id: UUID) -> ContaBancaria | None: ...

    @abstractmethod
    def create(self, conta: ContaBancaria) -> ContaBancaria: ...

    @abstractmethod
    def update(self, conta: ContaBancaria) -> ContaBancaria: ...

    @abstractmethod
    def delete(self, empresa_id: UUID, conta_id: UUID) -> bool: ...


class LancamentoBancarioRepository(ABC):
    @abstractmethod
    def list(
        self, empresa_id: UUID, conta_id: UUID | None,
        page: int, page_size: int,
    ) -> tuple[list[LancamentoBancario], int]: ...

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, lancamento_id: UUID) -> LancamentoBancario | None: ...

    @abstractmethod
    def create(self, lancamento: LancamentoBancario) -> LancamentoBancario: ...

    @abstractmethod
    def delete(self, empresa_id: UUID, lancamento_id: UUID) -> bool: ...

    @abstractmethod
    def saldo_conta(self, empresa_id: UUID, conta_id: UUID) -> float: ...
