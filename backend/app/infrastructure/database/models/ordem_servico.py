"""
Modelo ORM: OrdemServico, vinculada a uma Empresa (tenant).
Camada: Infrastructure.
"""
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.domain.entities.ordem_servico import StatusOrdemServico
from app.infrastructure.database.models.base import TenantModel


class OrdemServicoModel(TenantModel):
    __tablename__ = "ordens_servico"

    numero = Column(Integer, nullable=False)
    titulo = Column(String(255), nullable=False)
    descricao = Column(Text)
    cliente_id = Column(
        PGUUID(as_uuid=True), ForeignKey("clientes.id", ondelete="SET NULL"), index=True
    )
    obra_id = Column(
        PGUUID(as_uuid=True), ForeignKey("obras.id", ondelete="SET NULL"), index=True
    )
    instalador_id = Column(
        PGUUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), index=True
    )
    status = Column(String(20), nullable=False, default=StatusOrdemServico.PENDENTE.value, index=True)
    endereco = Column(String(500))
    data_agendada = Column(Date)
    foto_conclusao_url = Column(Text)
    observacoes_conclusao = Column(Text)
    concluido_em = Column(DateTime)
