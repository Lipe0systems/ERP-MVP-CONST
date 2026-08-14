"""
Endpoints de relatórios PDF.
Camada: Presentation.
"""
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query
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


@router.get("/compras/pdf")
def relatorio_compras_pdf(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    status: str | None = Query(None),
):
    """Gera relatório PDF de compras."""
    from app.application.services.pdf_compras import gerar_pdf_compras
    from app.infrastructure.database.models.compra import CompraModel

    q = db.query(CompraModel).filter(CompraModel.empresa_id == empresa_id)
    if status:
        q = q.filter(CompraModel.status == status)
    compras = q.order_by(CompraModel.data_compra.desc()).all()

    pdf_bytes = gerar_pdf_compras(compras)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="relatorio_compras.pdf"'},
    )


@router.get("/diario-obra/pdf")
def relatorio_diario_pdf(
    background_tasks: BackgroundTasks,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    obra_id: str | None = Query(None),
):
    """Gera relatório PDF do Diário de Obra."""
    from app.application.services.pdf_diario_obra import gerar_pdf_diario
    from app.application.services.documento_auto_service import salvar_documento_automatico
    from app.infrastructure.database.models.diario_obra import RegistroDiarioModel
    from app.infrastructure.database.models.obra import ObraModel

    q = db.query(RegistroDiarioModel).filter(RegistroDiarioModel.empresa_id == empresa_id)
    if obra_id:
        q = q.filter(RegistroDiarioModel.obra_id == obra_id)
    registros = q.order_by(RegistroDiarioModel.data.desc()).all()

    obra_nome = "Todas as Obras"
    obra_encontrada = None
    if obra_id:
        obra_encontrada = db.query(ObraModel).filter(
            ObraModel.empresa_id == empresa_id, ObraModel.id == obra_id
        ).first()
        if obra_encontrada:
            obra_nome = obra_encontrada.nome

    pdf_bytes = gerar_pdf_diario(registros, obra_nome)

    # Auto-save: só faz sentido quando o relatório é de UMA obra específica
    # (com "todas as obras" não haveria uma única "pasta" para guardar).
    if obra_encontrada:
        background_tasks.add_task(
            salvar_documento_automatico, db, empresa_id, "diario_obra.pdf", pdf_bytes,
            cliente_id=obra_encontrada.cliente_id, obra_id=obra_encontrada.id,
            descricao=f"Relatório do Diário de Obra — {obra_nome}, gerado automaticamente.",
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="diario_obra.pdf"'},
    )
