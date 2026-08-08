"""Interface do repositório de Recorrências Financeiras. Camada: Domain."""
from abc import ABC, abstractmethod
from uuid import UUID
from app.domain.entities.recorrencia import RecorrenciaFinanceira


class RecorrenciaRepository(ABC):
    @abstractmethod
    def list(self, empresa_id: UUID, ativo: bool | None) -> list[RecorrenciaFinanceira]: ...

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, recorrencia_id: UUID) -> RecorrenciaFinanceira | None: ...

    @abstractmethod
    def list_todas_ativas(self) -> list[RecorrenciaFinanceira]:
        """Usado pelo job de geração mensal — cruza todas as empresas."""
        ...

    @abstractmethod
    def create(self, r: RecorrenciaFinanceira) -> RecorrenciaFinanceira: ...

    @abstractmethod
    def update(self, r: RecorrenciaFinanceira) -> RecorrenciaFinanceira: ...

    @abstractmethod
    def delete(self, empresa_id: UUID, recorrencia_id: UUID) -> bool: ...
