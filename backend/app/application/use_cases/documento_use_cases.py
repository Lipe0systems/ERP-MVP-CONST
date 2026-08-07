"""Casos de uso do módulo Documentos. Camada: Application."""
import uuid
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.documento import Documento
from app.domain.repositories.documento_repository import DocumentoRepository


TIPOS_PERMITIDOS = {
    "application/pdf", "image/jpeg", "image/png", "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
TAMANHO_MAXIMO_MB = 20
TAMANHO_MAXIMO_BYTES = TAMANHO_MAXIMO_MB * 1024 * 1024


class DocumentoUseCases:
    def __init__(self, repository: DocumentoRepository):
        self.repository = repository

    def listar(self, empresa_id: UUID, cliente_id: UUID | None,
               obra_id: UUID | None, orcamento_id: UUID | None) -> list[Documento]:
        return self.repository.list(empresa_id, cliente_id, obra_id, orcamento_id)

    def obter(self, empresa_id: UUID, documento_id: UUID) -> Documento:
        doc = self.repository.get_by_id(empresa_id, documento_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento não encontrado.")
        return doc

    def registrar(
        self,
        empresa_id: UUID,
        nome: str,
        arquivo_url: str,
        arquivo_nome: str,
        arquivo_tipo: str,
        arquivo_tamanho: int,
        cliente_id: UUID | None,
        obra_id: UUID | None,
        orcamento_id: UUID | None,
        descricao: str | None,
    ) -> Documento:
        if arquivo_tipo not in TIPOS_PERMITIDOS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Tipo de arquivo não suportado: {arquivo_tipo}",
            )
        if arquivo_tamanho > TAMANHO_MAXIMO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Arquivo muito grande. Máximo: {TAMANHO_MAXIMO_MB}MB.",
            )
        if not any([cliente_id, obra_id, orcamento_id]):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="O documento deve ser vinculado a um Cliente, Obra ou Orçamento.",
            )

        doc = Documento(
            id=uuid.uuid4(), empresa_id=empresa_id,
            nome=nome.strip(), arquivo_url=arquivo_url,
            arquivo_nome=arquivo_nome, arquivo_tipo=arquivo_tipo,
            arquivo_tamanho=arquivo_tamanho,
            cliente_id=cliente_id, obra_id=obra_id, orcamento_id=orcamento_id,
            descricao=descricao,
        )
        return self.repository.create(doc)

    def remover(self, empresa_id: UUID, documento_id: UUID) -> str:
        """Remove do banco e retorna a URL para que o chamador possa limpar o Storage."""
        doc = self.obter(empresa_id, documento_id)
        self.repository.delete(empresa_id, documento_id)
        return doc.arquivo_url
