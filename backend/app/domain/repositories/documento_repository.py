"""Interface do repositório de Documentos. Camada: Domain."""
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.documento import Documento


class DocumentoRepository(ABC):
    @abstractmethod
    def list(self, empresa_id: UUID, cliente_id: UUID | None, obra_id: UUID | None,
             orcamento_id: UUID | None) -> list[Documento]: ...

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, documento_id: UUID) -> Documento | None: ...

    @abstractmethod
    def create(self, documento: Documento) -> Documento: ...

    @abstractmethod
    def delete(self, empresa_id: UUID, documento_id: UUID) -> bool: ...
