"""
Modelo ORM: ProcessoComercial — rastreia o estado do Workspace Comercial
(fluxo guiado Cliente → Orçamento → Proposta → Venda → Obra).

Este modelo NÃO duplica lógica de negócio: é só um "marcador de fase" que
referencia as entidades reais (Cliente, Orçamento, Venda, Obra), que
continuam sendo criadas e geridas pelos módulos existentes.
Camada: Infrastructure.
"""
from __future__ import annotations
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.infrastructure.database.models.base import TenantModel


class ProcessoComercialModel(TenantModel):
    __tablename__ = "processos_comerciais"

    nome = Column(String(255))
    cliente_id = Column(PGUUID(as_uuid=True), index=True)
    orcamento_id = Column(PGUUID(as_uuid=True))
    venda_id = Column(PGUUID(as_uuid=True))
    obra_id = Column(PGUUID(as_uuid=True))
    fase = Column(String(30), nullable=False, default="cliente", index=True)
    criado_por_id = Column(PGUUID(as_uuid=True))
