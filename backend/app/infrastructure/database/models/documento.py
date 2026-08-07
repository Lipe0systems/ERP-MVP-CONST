"""Modelo ORM: Documento. Camada: Infrastructure."""
from sqlalchemy import BigInteger, Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.infrastructure.database.models.base import TenantModel


class DocumentoModel(TenantModel):
    __tablename__ = "documentos"

    nome = Column(String(255), nullable=False)
    arquivo_url = Column(String(1000), nullable=False)
    arquivo_nome = Column(String(255), nullable=False)
    arquivo_tipo = Column(String(100), nullable=False)
    arquivo_tamanho = Column(BigInteger, nullable=False)
    cliente_id = Column(PGUUID(as_uuid=True), ForeignKey("clientes.id", ondelete="CASCADE"))
    obra_id = Column(PGUUID(as_uuid=True), ForeignKey("obras.id", ondelete="CASCADE"))
    orcamento_id = Column(PGUUID(as_uuid=True), ForeignKey("orcamentos.id", ondelete="CASCADE"))
    descricao = Column(Text)
