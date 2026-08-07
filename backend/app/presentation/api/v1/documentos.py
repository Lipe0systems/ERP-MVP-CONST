"""
Endpoints REST do módulo Documentos.
O upload do arquivo em si é feito pelo frontend diretamente no Supabase Storage
(mesmo padrão do Diário de Obra). Este endpoint só registra os metadados
(URL, nome, tipo, tamanho, vínculos) após o upload já ter acontecido.
Camada: Presentation.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.application.use_cases.documento_use_cases import DocumentoUseCases
from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.documento_repository import SqlAlchemyDocumentoRepository
from app.presentation.schemas.documento import DocumentoOut, DocumentoRegistrarIn

router = APIRouter(prefix="/documentos", tags=["Documentos"])


def _uc(db: Session = Depends(get_db)) -> DocumentoUseCases:
    return DocumentoUseCases(SqlAlchemyDocumentoRepository(db))


@router.get("", response_model=list[DocumentoOut])
def listar(
    empresa_id: UUID = Depends(get_empresa_id),
    uc: DocumentoUseCases = Depends(_uc),
    cliente_id: UUID | None = None,
    obra_id: UUID | None = None,
    orcamento_id: UUID | None = None,
):
    return uc.listar(empresa_id, cliente_id, obra_id, orcamento_id)


@router.post("", response_model=DocumentoOut, status_code=201)
def registrar(
    body: DocumentoRegistrarIn,
    empresa_id: UUID = Depends(get_empresa_id),
    uc: DocumentoUseCases = Depends(_uc),
):
    return uc.registrar(
        empresa_id=empresa_id,
        nome=body.nome, arquivo_url=body.arquivo_url,
        arquivo_nome=body.arquivo_nome, arquivo_tipo=body.arquivo_tipo,
        arquivo_tamanho=body.arquivo_tamanho,
        cliente_id=body.cliente_id, obra_id=body.obra_id,
        orcamento_id=body.orcamento_id, descricao=body.descricao,
    )


@router.delete("/{documento_id}", status_code=204)
def remover(
    documento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    uc: DocumentoUseCases = Depends(_uc),
):
    # A URL retornada deve ser usada pelo frontend para limpar o Storage
    uc.remover(empresa_id, documento_id)
