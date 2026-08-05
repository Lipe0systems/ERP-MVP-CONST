"""
Modelo ORM: RegistroDiario, vinculado a uma Empresa e a uma Obra (obrigatório).
Camada: Infrastructure.
"""
from sqlalchemy import Column, Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID

from app.infrastructure.database.models.base import TenantModel


class RegistroDiarioModel(TenantModel):
    __tablename__ = "diario_obra"

    # ondelete="RESTRICT": mantém o histórico do diário íntegro — não é
    # possível excluir uma Obra que possua registros de diário vinculados
    # (mesmo padrão já usado em Compras/Financeiro).
    obra_id = Column(PGUUID(as_uuid=True), ForeignKey("obras.id", ondelete="RESTRICT"), nullable=False, index=True)
    data = Column(Date, nullable=False, index=True)
    clima = Column(String(30))
    observacoes = Column(Text, nullable=False)
    # Lista de URLs públicas do Supabase Storage — JSONB por ser uma lista de
    # tamanho variável; nenhum arquivo binário passa pelo backend.
    fotos = Column(JSONB, nullable=False, default=list)
