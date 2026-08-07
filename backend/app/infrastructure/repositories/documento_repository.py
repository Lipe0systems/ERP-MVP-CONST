"""Implementação SQLAlchemy do DocumentoRepository. Camada: Infrastructure."""
from uuid import UUID
from sqlalchemy.orm import Session
from app.domain.entities.documento import Documento
from app.domain.repositories.documento_repository import DocumentoRepository
from app.infrastructure.database.models.documento import DocumentoModel


def _to_entity(m: DocumentoModel) -> Documento:
    return Documento(
        id=m.id, empresa_id=m.empresa_id, nome=m.nome,
        arquivo_url=m.arquivo_url, arquivo_nome=m.arquivo_nome,
        arquivo_tipo=m.arquivo_tipo, arquivo_tamanho=int(m.arquivo_tamanho),
        cliente_id=m.cliente_id, obra_id=m.obra_id, orcamento_id=m.orcamento_id,
        descricao=m.descricao, criado_em=m.criado_em,
    )


class SqlAlchemyDocumentoRepository(DocumentoRepository):
    def __init__(self, db: Session): self.db = db

    def list(self, empresa_id: UUID, cliente_id: UUID | None, obra_id: UUID | None,
             orcamento_id: UUID | None) -> list[Documento]:
        q = self.db.query(DocumentoModel).filter(DocumentoModel.empresa_id == empresa_id)
        if cliente_id: q = q.filter(DocumentoModel.cliente_id == cliente_id)
        if obra_id: q = q.filter(DocumentoModel.obra_id == obra_id)
        if orcamento_id: q = q.filter(DocumentoModel.orcamento_id == orcamento_id)
        return [_to_entity(r) for r in q.order_by(DocumentoModel.criado_em.desc()).all()]

    def get_by_id(self, empresa_id: UUID, documento_id: UUID) -> Documento | None:
        m = self.db.query(DocumentoModel).filter(
            DocumentoModel.empresa_id == empresa_id,
            DocumentoModel.id == documento_id,
        ).first()
        return _to_entity(m) if m else None

    def create(self, documento: Documento) -> Documento:
        m = DocumentoModel(
            id=documento.id, empresa_id=documento.empresa_id, nome=documento.nome,
            arquivo_url=documento.arquivo_url, arquivo_nome=documento.arquivo_nome,
            arquivo_tipo=documento.arquivo_tipo, arquivo_tamanho=documento.arquivo_tamanho,
            cliente_id=documento.cliente_id, obra_id=documento.obra_id,
            orcamento_id=documento.orcamento_id, descricao=documento.descricao,
        )
        self.db.add(m); self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def delete(self, empresa_id: UUID, documento_id: UUID) -> bool:
        m = self.db.query(DocumentoModel).filter(
            DocumentoModel.empresa_id == empresa_id,
            DocumentoModel.id == documento_id,
        ).first()
        if not m: return False
        self.db.delete(m); self.db.commit()
        return True
