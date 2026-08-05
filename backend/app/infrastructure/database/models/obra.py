"""
Modelo ORM: Obra, vinculada a uma Empresa (tenant) e a um Cliente.
Camada: Infrastructure.
"""
from sqlalchemy import Column, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.domain.entities.obra import ObraStatus
from app.infrastructure.database.models.base import TenantModel


class ObraModel(TenantModel):
    __tablename__ = "obras"

    nome = Column(String(255), nullable=False)
    # ondelete="RESTRICT": impede excluir um Cliente que possua Obras vinculadas
    # (tratado como erro de negócio amigável na camada de repositório/use case).
    cliente_id = Column(
        PGUUID(as_uuid=True), ForeignKey("clientes.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    endereco = Column(String(500))
    responsavel = Column(String(255))
    data_inicio = Column(Date)
    data_previsao = Column(Date)
    status = Column(String(20), nullable=False, default=ObraStatus.PLANEJAMENTO.value, index=True)
    valor_previsto = Column(Numeric(14, 2))
    valor_realizado = Column(Numeric(14, 2))
