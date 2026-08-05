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
from app.core.security import get_empresa_id
from app.domain.entities.financeiro import StatusConta
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
from app.infrastructure.repositories.conta_pagar_repository import SqlAlchemyContaPagarRepository
from app.infrastructure.repositories.conta_receber_repository import SqlAlchemyContaReceberRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository
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
