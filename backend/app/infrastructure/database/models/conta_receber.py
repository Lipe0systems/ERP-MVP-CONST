"""
Modelo ORM: ContaReceber, vinculada a uma Empresa e, opcionalmente, a um
Cliente e/ou a uma Obra. Camada: Infrastructure.
"""
from sqlalchemy import Column, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.domain.entities.financeiro import StatusConta
from app.infrastructure.database.models.base import TenantModel


class ContaReceberModel(TenantModel):
    __tablename__ = "contas_receber"

    descricao = Column(String(255), nullable=False)
    valor = Column(Numeric(14, 2), nullable=False)
    data_vencimento = Column(Date, nullable=False, index=True)
    # ondelete="RESTRICT" nos dois: mantém o histórico financeiro íntegro —
    # não é possível excluir um Cliente ou uma Obra com lançamentos vinculados.
    cliente_id = Column(PGUUID(as_uuid=True), ForeignKey("clientes.id", ondelete="RESTRICT"), index=True)
    obra_id = Column(PGUUID(as_uuid=True), ForeignKey("obras.id", ondelete="RESTRICT"), index=True)
    data_recebimento = Column(Date)
    status = Column(String(20), nullable=False, default=StatusConta.PENDENTE.value, index=True)
    categoria = Column(String(100))
    # V4 — Integração Financeiro → Banco: lançamento gerado ao liquidar
    lancamento_bancario_id = Column(PGUUID(as_uuid=True), ForeignKey("lancamentos_bancarios.id", ondelete="SET NULL"))
    conta_bancaria_id = Column(PGUUID(as_uuid=True), ForeignKey("contas_bancarias.id", ondelete="SET NULL"))
    comprovante_url = Column(String(1000))
    observacoes = Column(Text)
