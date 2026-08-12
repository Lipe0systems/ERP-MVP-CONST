"""
Endpoints REST do módulo Financeiro: Contas a Pagar, Contas a Receber e
Resumo Financeiro. Camada: Presentation.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.application.use_cases.conta_pagar_use_cases import ContaPagarUseCases
from app.application.use_cases.conta_receber_use_cases import ContaReceberUseCases
from app.application.use_cases.financeiro_resumo_use_case import FinanceiroResumoUseCase
from app.core.security import get_empresa_id, get_current_user, CurrentUser
from app.application.services.auditoria_service import registrar as audit
from app.domain.entities.auditoria import AcaoAuditoria
from app.domain.entities.financeiro import StatusConta
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
from app.infrastructure.repositories.conta_pagar_repository import SqlAlchemyContaPagarRepository
from app.infrastructure.repositories.conta_receber_repository import SqlAlchemyContaReceberRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository
from pydantic import BaseModel
from datetime import date as _date
import uuid as _uuid
from app.presentation.schemas.financeiro import (
    ContaPagarCreate,
    ContaPagarListOut,
    ContaPagarOut,
    ContaPagarUpdate,
    ContaReceberCreate,
    ContaReceberListOut,
    ContaReceberOut,
    ContaReceberUpdate,
    FinanceiroResumoOut,
)

router = APIRouter(tags=["Financeiro"])


def _get_pagar_use_cases(db: Session = Depends(get_db)) -> ContaPagarUseCases:
    return ContaPagarUseCases(
        repository=SqlAlchemyContaPagarRepository(db),
        obra_repository=SqlAlchemyObraRepository(db),
    )


def _get_receber_use_cases(db: Session = Depends(get_db)) -> ContaReceberUseCases:
    return ContaReceberUseCases(
        repository=SqlAlchemyContaReceberRepository(db),
        cliente_repository=SqlAlchemyClienteRepository(db),
        obra_repository=SqlAlchemyObraRepository(db),
    )


def _get_resumo_use_case(db: Session = Depends(get_db)) -> FinanceiroResumoUseCase:
    return FinanceiroResumoUseCase(
        pagar_repository=SqlAlchemyContaPagarRepository(db),
        receber_repository=SqlAlchemyContaReceberRepository(db),
    )


# ---------------------------------------------------------------------------
# Resumo
# ---------------------------------------------------------------------------


@router.get("/financeiro/resumo", response_model=FinanceiroResumoOut)
def obter_resumo_financeiro(
    empresa_id: UUID = Depends(get_empresa_id),
    use_case: FinanceiroResumoUseCase = Depends(_get_resumo_use_case),
):
    return use_case.obter_resumo(empresa_id)


# ---------------------------------------------------------------------------
# Contas a Pagar
# ---------------------------------------------------------------------------


@router.get("/contas-pagar", response_model=ContaPagarListOut)
def listar_contas_pagar(
    search: str | None = Query(None, description="Busca por descrição ou fornecedor"),
    status_filtro: StatusConta | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaPagarUseCases = Depends(_get_pagar_use_cases),
):
    itens, total = use_cases.listar(empresa_id, search, status_filtro, page, page_size)
    return ContaPagarListOut(items=itens, total=total, page=page, page_size=page_size)


@router.get("/contas-pagar/{conta_id}", response_model=ContaPagarOut)
def obter_conta_pagar(
    conta_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaPagarUseCases = Depends(_get_pagar_use_cases),
):
    return use_cases.obter(empresa_id, conta_id)


@router.post("/contas-pagar", response_model=ContaPagarOut, status_code=status.HTTP_201_CREATED)
def criar_conta_pagar(
    payload: ContaPagarCreate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaPagarUseCases = Depends(_get_pagar_use_cases),
):
    return use_cases.criar(
        empresa_id=empresa_id,
        descricao=payload.descricao,
        valor=payload.valor,
        data_vencimento=payload.data_vencimento,
        fornecedor=payload.fornecedor,
        obra_id=payload.obra_id,
        categoria=payload.categoria,
        data_pagamento=payload.data_pagamento,
        status_conta=payload.status,
        observacoes=payload.observacoes,
    )


@router.put("/contas-pagar/{conta_id}", response_model=ContaPagarOut)
def atualizar_conta_pagar(
    conta_id: UUID,
    payload: ContaPagarUpdate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaPagarUseCases = Depends(_get_pagar_use_cases),
):
    return use_cases.atualizar(
        empresa_id=empresa_id,
        conta_id=conta_id,
        descricao=payload.descricao,
        valor=payload.valor,
        data_vencimento=payload.data_vencimento,
        fornecedor=payload.fornecedor,
        obra_id=payload.obra_id,
        categoria=payload.categoria,
        data_pagamento=payload.data_pagamento,
        status_conta=payload.status,
        observacoes=payload.observacoes,
    )


@router.delete("/contas-pagar/{conta_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_conta_pagar(
    conta_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaPagarUseCases = Depends(_get_pagar_use_cases),
):
    use_cases.remover(empresa_id, conta_id)


# ---------------------------------------------------------------------------
# Contas a Receber
# ---------------------------------------------------------------------------


@router.get("/contas-receber", response_model=ContaReceberListOut)
def listar_contas_receber(
    search: str | None = Query(None, description="Busca por descrição"),
    status_filtro: StatusConta | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaReceberUseCases = Depends(_get_receber_use_cases),
):
    itens, total = use_cases.listar(empresa_id, search, status_filtro, page, page_size)
    return ContaReceberListOut(items=itens, total=total, page=page, page_size=page_size)


@router.get("/contas-receber/{conta_id}", response_model=ContaReceberOut)
def obter_conta_receber(
    conta_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaReceberUseCases = Depends(_get_receber_use_cases),
):
    return use_cases.obter(empresa_id, conta_id)


@router.post("/contas-receber", response_model=ContaReceberOut, status_code=status.HTTP_201_CREATED)
def criar_conta_receber(
    payload: ContaReceberCreate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaReceberUseCases = Depends(_get_receber_use_cases),
):
    return use_cases.criar(
        empresa_id=empresa_id,
        descricao=payload.descricao,
        valor=payload.valor,
        data_vencimento=payload.data_vencimento,
        cliente_id=payload.cliente_id,
        obra_id=payload.obra_id,
        data_recebimento=payload.data_recebimento,
        status_conta=payload.status,
        observacoes=payload.observacoes,
    )


@router.put("/contas-receber/{conta_id}", response_model=ContaReceberOut)
def atualizar_conta_receber(
    conta_id: UUID,
    payload: ContaReceberUpdate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaReceberUseCases = Depends(_get_receber_use_cases),
):
    return use_cases.atualizar(
        empresa_id=empresa_id,
        conta_id=conta_id,
        descricao=payload.descricao,
        valor=payload.valor,
        data_vencimento=payload.data_vencimento,
        cliente_id=payload.cliente_id,
        obra_id=payload.obra_id,
        data_recebimento=payload.data_recebimento,
        status_conta=payload.status,
        observacoes=payload.observacoes,
    )


@router.delete("/contas-receber/{conta_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_conta_receber(
    conta_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ContaReceberUseCases = Depends(_get_receber_use_cases),
):
    use_cases.remover(empresa_id, conta_id)

# ═══ V4 — Financeiro → Banco: pagar/receber gera lançamento automático (Fluxo 7) ══

class _LiquidarIn(BaseModel):
    conta_bancaria_id: UUID
    data: _date | None = None


@router.post("/contas-pagar/{conta_id}/pagar", response_model=ContaPagarOut)
def pagar_conta(
    conta_id: UUID,
    body: _LiquidarIn,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    use_cases: ContaPagarUseCases = Depends(_get_pagar_use_cases),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Marca a conta como liquidada (paga) e cria automaticamente o lançamento
    bancário de saída correspondente, atualizando o saldo da conta escolhida.
    Evita duplicidade: se a conta já tiver um lançamento vinculado, não cria outro.
    """
    from fastapi import HTTPException
    from app.infrastructure.database.models.conta_pagar import ContaPagarModel
    from app.infrastructure.database.models.banco import LancamentoBancarioModel

    model = db.query(ContaPagarModel).filter(
        ContaPagarModel.empresa_id == empresa_id, ContaPagarModel.id == conta_id
    ).first()
    if not model:
        raise HTTPException(404, "Conta a pagar não encontrada.")
    if model.lancamento_bancario_id:
        raise HTTPException(422, "Esta conta já foi paga e possui um lançamento bancário vinculado.")

    data_pagamento = body.data or _date.today()

    lanc = LancamentoBancarioModel(
        id=_uuid.uuid4(),
        empresa_id=empresa_id,
        conta_id=body.conta_bancaria_id,
        tipo="saida",
        valor=model.valor,
        descricao=f"Pagamento: {model.descricao}",
        data=data_pagamento,
        categoria=model.categoria,
        referencia=f"conta_pagar:{model.id}",
    )
    db.add(lanc)
    db.flush()

    model.status = "liquidado"
    model.data_pagamento = data_pagamento
    model.lancamento_bancario_id = lanc.id
    model.conta_bancaria_id = body.conta_bancaria_id
    db.commit()
    db.refresh(model)

    try:
        audit(db, usuario=current_user, modulo="financeiro", acao=AcaoAuditoria.EDITOU,
              entidade_id=str(model.id), descricao=f"Conta paga: {model.descricao}.")
    except Exception:
        pass

    return use_cases.obter(empresa_id, conta_id)


@router.post("/contas-receber/{conta_id}/receber", response_model=ContaReceberOut)
def receber_conta(
    conta_id: UUID,
    body: _LiquidarIn,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    use_cases: ContaReceberUseCases = Depends(_get_receber_use_cases),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Espelho de /contas-pagar/{id}/pagar — liquida e gera lançamento de entrada."""
    from fastapi import HTTPException
    from app.infrastructure.database.models.conta_receber import ContaReceberModel
    from app.infrastructure.database.models.banco import LancamentoBancarioModel

    model = db.query(ContaReceberModel).filter(
        ContaReceberModel.empresa_id == empresa_id, ContaReceberModel.id == conta_id
    ).first()
    if not model:
        raise HTTPException(404, "Conta a receber não encontrada.")
    if model.lancamento_bancario_id:
        raise HTTPException(422, "Esta conta já foi recebida e possui um lançamento bancário vinculado.")

    data_recebimento = body.data or _date.today()

    lanc = LancamentoBancarioModel(
        id=_uuid.uuid4(),
        empresa_id=empresa_id,
        conta_id=body.conta_bancaria_id,
        tipo="entrada",
        valor=model.valor,
        descricao=f"Recebimento: {model.descricao}",
        data=data_recebimento,
        referencia=f"conta_receber:{model.id}",
    )
    db.add(lanc)
    db.flush()

    model.status = "liquidado"
    model.data_recebimento = data_recebimento
    model.lancamento_bancario_id = lanc.id
    model.conta_bancaria_id = body.conta_bancaria_id
    db.commit()
    db.refresh(model)

    try:
        audit(db, usuario=current_user, modulo="financeiro", acao=AcaoAuditoria.EDITOU,
              entidade_id=str(model.id), descricao=f"Conta recebida: {model.descricao}.")
    except Exception:
        pass

    return use_cases.obter(empresa_id, conta_id)
