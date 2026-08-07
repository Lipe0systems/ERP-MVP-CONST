"""Endpoints REST do módulo Bancário. Camada: Presentation."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.application.use_cases.banco_use_cases import BancoUseCases
from app.core.security import get_empresa_id
from app.domain.entities.banco import TipoConta, TipoLancamento
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.banco_repository import SqlAlchemyContaBancariaRepository, SqlAlchemyLancamentoBancarioRepository
from app.presentation.schemas.banco import ContaBancariaIn, ContaBancariaOut, LancamentoBancarioIn, LancamentoBancarioOut, LancamentosListOut

router = APIRouter(prefix="/banco", tags=["Banco"])


def _uc(db: Session = Depends(get_db)) -> BancoUseCases:
    return BancoUseCases(
        contas_repo=SqlAlchemyContaBancariaRepository(db),
        lanc_repo=SqlAlchemyLancamentoBancarioRepository(db),
    )


# --- Contas ---

@router.get("/contas")
def listar_contas(empresa_id: UUID = Depends(get_empresa_id), uc: BancoUseCases = Depends(_uc)):
    return uc.listar_contas(empresa_id)


@router.post("/contas", response_model=ContaBancariaOut, status_code=201)
def criar_conta(body: ContaBancariaIn, empresa_id: UUID = Depends(get_empresa_id), uc: BancoUseCases = Depends(_uc)):
    return uc.criar_conta(empresa_id, body.nome, body.banco, body.agencia, body.numero_conta, body.tipo, body.saldo_inicial, body.observacoes)


@router.put("/contas/{conta_id}", response_model=ContaBancariaOut)
def atualizar_conta(conta_id: UUID, body: ContaBancariaIn, empresa_id: UUID = Depends(get_empresa_id), uc: BancoUseCases = Depends(_uc)):
    return uc.atualizar_conta(empresa_id, conta_id, body.nome, body.banco, body.agencia, body.numero_conta, body.tipo, body.saldo_inicial, body.observacoes)


@router.delete("/contas/{conta_id}", status_code=204)
def remover_conta(conta_id: UUID, empresa_id: UUID = Depends(get_empresa_id), uc: BancoUseCases = Depends(_uc)):
    uc.remover_conta(empresa_id, conta_id)


@router.get("/saldo")
def saldo_total(empresa_id: UUID = Depends(get_empresa_id), uc: BancoUseCases = Depends(_uc)):
    return uc.saldo_total(empresa_id)


# --- Lançamentos ---

@router.get("/lancamentos", response_model=LancamentosListOut)
def listar_lancamentos(
    empresa_id: UUID = Depends(get_empresa_id), uc: BancoUseCases = Depends(_uc),
    conta_id: UUID | None = None,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
):
    items, total = uc.listar_lancamentos(empresa_id, conta_id, page, page_size)
    return LancamentosListOut(items=items, total=total, page=page, page_size=page_size)


@router.post("/lancamentos", response_model=LancamentoBancarioOut, status_code=201)
def criar_lancamento(body: LancamentoBancarioIn, empresa_id: UUID = Depends(get_empresa_id), uc: BancoUseCases = Depends(_uc)):
    return uc.criar_lancamento(empresa_id, body.conta_id, body.tipo, body.valor, body.descricao, body.data, body.categoria, body.referencia)


@router.delete("/lancamentos/{lancamento_id}", status_code=204)
def remover_lancamento(lancamento_id: UUID, empresa_id: UUID = Depends(get_empresa_id), uc: BancoUseCases = Depends(_uc)):
    uc.remover_lancamento(empresa_id, lancamento_id)
