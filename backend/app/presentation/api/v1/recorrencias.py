"""Endpoints REST do módulo Recorrência Financeira. Camada: Presentation."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.application.use_cases.recorrencia_use_cases import RecorrenciaUseCases
from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.conta_pagar_repository import SqlAlchemyContaPagarRepository
from app.infrastructure.repositories.conta_receber_repository import SqlAlchemyContaReceberRepository
from app.infrastructure.repositories.recorrencia_repository import SqlAlchemyRecorrenciaRepository
from app.presentation.schemas.recorrencia import RecorrenciaCreateIn, RecorrenciaOut, RecorrenciaUpdateIn

router = APIRouter(prefix="/recorrencias", tags=["Recorrências Financeiras"])


def _uc(db: Session = Depends(get_db)) -> RecorrenciaUseCases:
    return RecorrenciaUseCases(
        repository=SqlAlchemyRecorrenciaRepository(db),
        conta_pagar_repository=SqlAlchemyContaPagarRepository(db),
        conta_receber_repository=SqlAlchemyContaReceberRepository(db),
    )


@router.get("", response_model=list[RecorrenciaOut])
def listar(empresa_id: UUID = Depends(get_empresa_id), uc: RecorrenciaUseCases = Depends(_uc), ativo: bool | None = None):
    return uc.listar(empresa_id, ativo)


@router.post("", response_model=RecorrenciaOut, status_code=201)
def criar(body: RecorrenciaCreateIn, empresa_id: UUID = Depends(get_empresa_id), uc: RecorrenciaUseCases = Depends(_uc)):
    return uc.criar(
        empresa_id=empresa_id, tipo=body.tipo, descricao=body.descricao,
        valor=body.valor, dia_vencimento=body.dia_vencimento,
        fornecedor=body.fornecedor, cliente_id=body.cliente_id,
        obra_id=body.obra_id, categoria=body.categoria,
        observacoes=body.observacoes, gerar_mes_atual=body.gerar_mes_atual,
    )


@router.put("/{recorrencia_id}", response_model=RecorrenciaOut)
def atualizar(recorrencia_id: UUID, body: RecorrenciaUpdateIn, empresa_id: UUID = Depends(get_empresa_id), uc: RecorrenciaUseCases = Depends(_uc)):
    return uc.atualizar(
        empresa_id=empresa_id, recorrencia_id=recorrencia_id,
        descricao=body.descricao, valor=body.valor,
        dia_vencimento=body.dia_vencimento, ativo=body.ativo,
        fornecedor=body.fornecedor, cliente_id=body.cliente_id,
        obra_id=body.obra_id, categoria=body.categoria, observacoes=body.observacoes,
    )


@router.delete("/{recorrencia_id}", status_code=204)
def remover(recorrencia_id: UUID, empresa_id: UUID = Depends(get_empresa_id), uc: RecorrenciaUseCases = Depends(_uc)):
    uc.remover(empresa_id, recorrencia_id)


@router.post("/gerar-pendentes")
def gerar_pendentes(
    empresa_id: UUID = Depends(get_empresa_id),
    uc: RecorrenciaUseCases = Depends(_uc),
    meses_a_frente: int = Query(1, ge=0, le=12),
):
    """Gera manualmente as contas pendentes de todas as recorrências ativas da empresa."""
    return uc.gerar_pendentes(empresa_id, meses_a_frente)
