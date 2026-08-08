"""Modelo ORM: Atendimento. Camada: Infrastructure."""
from sqlalchemy import Column, Date, ForeignKey, String, Text, Time
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PGUUID
from sqlalchemy import String as SA_String

from app.domain.entities.atendimento import StatusAtendimento, TipoAtendimento
from app.infrastructure.database.models.base import TenantModel


class AtendimentoModel(TenantModel):
    __tablename__ = "atendimentos"

    cliente_id = Column(PGUUID(as_uuid=True), ForeignKey("clientes.id", ondelete="RESTRICT"), nullable=False, index=True)
    obra_id = Column(PGUUID(as_uuid=True), ForeignKey("obras.id", ondelete="RESTRICT"), index=True)
    tipo = Column(String(20), nullable=False, default=TipoAtendimento.VISITA.value)
    status = Column(String(20), nullable=False, default=StatusAtendimento.AGENDADO.value, index=True)
    data = Column(Date, nullable=False)
    hora = Column(Time)
    responsavel = Column(String(255))
    descricao = Column(Text)
    # Arrays de strings (checklist e fotos) — Postgres ARRAY é mais limpo que JSON aqui
    checklist = Column(ARRAY(SA_String), nullable=False, default=list)
    checklist_ok = Column(ARRAY(SA_String), nullable=False, default=list)
    fotos = Column(ARRAY(SA_String), nullable=False, default=list)
    assinatura_url = Column(String(1000))
    observacoes = Column(Text)
