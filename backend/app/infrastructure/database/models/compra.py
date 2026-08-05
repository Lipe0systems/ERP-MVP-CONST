"""
Modelo ORM: Compra, vinculada a uma Empresa e, opcionalmente, a uma Obra.
Camada: Infrastructure.
"""
from sqlalchemy import Column, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.domain.entities.compra import StatusCompra
from app.infrastructure.database.models.base import TenantModel


class CompraModel(TenantModel):
    __tablename__ = "compras"

    fornecedor = Column(String(255), nullable=False)
    produto = Column(String(255), nullable=False)
    quantidade = Column(Numeric(14, 3), nullable=False)
    unidade = Column(String(20))
    valor_unitario = Column(Numeric(14, 2), nullable=False)
    data_compra = Column(Date, nullable=False, index=True)
    # ondelete="RESTRICT": mantém o histórico de compras íntegro — não é
    # possível excluir uma Obra que possua compras vinculadas.
    obra_id = Column(PGUUID(as_uuid=True), ForeignKey("obras.id", ondelete="RESTRICT"), index=True)
    status = Column(String(20), nullable=False, default=StatusCompra.PENDENTE.value, index=True)
    observacoes = Column(Text)
