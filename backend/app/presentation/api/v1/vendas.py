"""Endpoints REST do módulo Vendas. Camada: Presentation."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.application.use_cases.venda_use_cases import VendaUseCases
from app.core.security import get_empresa_id
from app.domain.entities.venda import StatusVenda
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.conta_receber_repository import SqlAlchemyContaReceberRepository
from app.infrastructure.repositories.orcamento_repository import SqlAlchemyOrcamentoRepository
from app.infrastructure.repositories.venda_repository import SqlAlchemyVendaRepository
from app.presentation.schemas.venda import (
    VendaCreateIn, VendaDeOrcamentoIn, VendaListOut, VendaOut,
)

router = APIRouter(prefix="/vendas", tags=["Vendas"])


def _uc(db: Session = Depends(get_db)) -> VendaUseCases:
    return VendaUseCases(
        repository=SqlAlchemyVendaRepository(db),
        orcamento_repository=SqlAlchemyOrcamentoRepository(db),
        conta_receber_repository=SqlAlchemyContaReceberRepository(db),
    )


def _to_out(v) -> VendaOut:
    from app.presentation.schemas.venda import ParcelaOut
    return VendaOut(
        id=v.id, numero=v.numero, cliente_id=v.cliente_id,
        orcamento_id=v.orcamento_id, obra_id=v.obra_id,
        status=v.status, forma_pagamento=v.forma_pagamento,
        valor_total=v.valor_total, desconto=v.desconto,
        valor_liquido=v.valor_liquido, observacoes=v.observacoes,
        criado_em=v.criado_em,
        parcelas=[ParcelaOut(id=p.id, numero=p.numero, valor=p.valor,
                             vencimento=p.vencimento, conta_receber_id=p.conta_receber_id)
                  for p in v.parcelas],
    )


@router.get("", response_model=VendaListOut)
def listar(
    empresa_id: UUID = Depends(get_empresa_id), uc: VendaUseCases = Depends(_uc),
    status: StatusVenda | None = None,
    page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100),
):
    items, total = uc.listar(empresa_id, status, page, page_size)
    return VendaListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/{venda_id}", response_model=VendaOut)
def obter(venda_id: UUID, empresa_id: UUID = Depends(get_empresa_id), uc: VendaUseCases = Depends(_uc)):
    return _to_out(uc.obter(empresa_id, venda_id))


@router.post("/de-orcamento", response_model=VendaOut, status_code=201)
def criar_de_orcamento(
    body: VendaDeOrcamentoIn,
    empresa_id: UUID = Depends(get_empresa_id), uc: VendaUseCases = Depends(_uc),
):
    return _to_out(uc.criar_de_orcamento(
        empresa_id=empresa_id, orcamento_id=body.orcamento_id,
        forma_pagamento=body.forma_pagamento, num_parcelas=body.num_parcelas,
        dias_primeiro_vencimento=body.dias_primeiro_vencimento,
        desconto=body.desconto, observacoes=body.observacoes,
    ))


@router.post("", response_model=VendaOut, status_code=201)
def criar(
    body: VendaCreateIn,
    empresa_id: UUID = Depends(get_empresa_id), uc: VendaUseCases = Depends(_uc),
):
    return _to_out(uc.criar(
        empresa_id=empresa_id, cliente_id=body.cliente_id, obra_id=body.obra_id,
        valor_total=body.valor_total, forma_pagamento=body.forma_pagamento,
        num_parcelas=body.num_parcelas,
        dias_primeiro_vencimento=body.dias_primeiro_vencimento,
        desconto=body.desconto, observacoes=body.observacoes,
    ))


@router.post("/{venda_id}/cancelar", response_model=VendaOut)
def cancelar(venda_id: UUID, empresa_id: UUID = Depends(get_empresa_id), uc: VendaUseCases = Depends(_uc)):
    return _to_out(uc.cancelar(empresa_id, venda_id))


@router.get("/{venda_id}/pdf")
def pdf_venda(
    venda_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    uc: VendaUseCases = Depends(_uc),
    db: Session = Depends(get_db),
):
    from app.application.services.pdf_venda import gerar_pdf_venda
    from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
    venda = uc.obter(empresa_id, venda_id)
    cliente = SqlAlchemyClienteRepository(db).get_by_id(empresa_id, venda.cliente_id)
    if not cliente:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    pdf = gerar_pdf_venda(venda, cliente)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="venda_{venda.numero:04d}.pdf"'})
