"""
Endpoints de relatórios PDF.
Camada: Presentation.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])


@router.get("/financeiro/pdf")
def relatorio_financeiro_pdf(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    status: str | None = Query(None, description="Filtrar por status: pendente, liquidado, cancelado"),
):
    """Gera relatório PDF do financeiro (contas a pagar e receber)."""
    from app.application.services.pdf_financeiro import gerar_pdf_financeiro
    from app.infrastructure.database.models.conta_pagar import ContaPagarModel
    from app.infrastructure.database.models.conta_receber import ContaReceberModel
    from app.infrastructure.database.models.cliente import ClienteModel

    # Contas a receber com nome do cliente
    cr_query = (
        db.query(ContaReceberModel, ClienteModel.nome)
        .outerjoin(ClienteModel, ClienteModel.id == ContaReceberModel.cliente_id)
        .filter(ContaReceberModel.empresa_id == empresa_id)
    )
    if status:
        cr_query = cr_query.filter(ContaReceberModel.status == status)
    cr_rows = cr_query.order_by(ContaReceberModel.data_vencimento).all()

    # Montar objetos com cliente_nome
    class CRItem:
        def __init__(self, model, cliente_nome):
            self.descricao = model.descricao
            self.valor = model.valor
            self.data_vencimento = model.data_vencimento
            self.status = model.status
            self.cliente_nome = cliente_nome

    contas_receber = [CRItem(m, cn) for m, cn in cr_rows]
    total_receber = sum(float(cr.valor) for cr in contas_receber if cr.status != "cancelado")

    # Contas a pagar
    cp_query = db.query(ContaPagarModel).filter(ContaPagarModel.empresa_id == empresa_id)
    if status:
        cp_query = cp_query.filter(ContaPagarModel.status == status)
    cp_rows = cp_query.order_by(ContaPagarModel.data_vencimento).all()

    class CPItem:
        def __init__(self, model):
            self.descricao = model.descricao
            self.valor = model.valor
            self.data_vencimento = model.data_vencimento
            self.status = model.status
            self.fornecedor = model.fornecedor

    contas_pagar = [CPItem(m) for m in cp_rows]
    total_pagar = sum(float(cp.valor) for cp in contas_pagar if cp.status != "cancelado")

    pdf_bytes = gerar_pdf_financeiro(contas_pagar, contas_receber, total_pagar, total_receber)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="relatorio_financeiro.pdf"'},
    )


@router.get("/orcamentos/pdf")
def relatorio_orcamentos_pdf(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    status: str | None = Query(None, description="Filtrar por status"),
):
    """Gera relatório PDF consolidado de orçamentos."""
    from app.application.services.pdf_orcamentos_relatorio import gerar_pdf_orcamentos_relatorio
    from app.infrastructure.repositories.orcamento_repository import SqlAlchemyOrcamentoRepository
    from app.domain.entities.orcamento import StatusOrcamento

    repo = SqlAlchemyOrcamentoRepository(db)
    status_filtro = StatusOrcamento(status) if status else None
    items, _ = repo.list_with_relacionamentos(empresa_id, None, status_filtro, 1, 1000)

    pdf_bytes = gerar_pdf_orcamentos_relatorio(items)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="relatorio_orcamentos.pdf"'},
    )
