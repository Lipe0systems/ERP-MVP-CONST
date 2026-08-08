"""Endpoints REST do módulo Atendimentos. Camada: Presentation."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.application.use_cases.atendimento_use_cases import AtendimentoUseCases
from app.core.security import get_empresa_id
from app.domain.entities.atendimento import StatusAtendimento
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.atendimento_repository import SqlAlchemyAtendimentoRepository
from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository
from app.presentation.schemas.atendimento import (
    AtendimentoIn, AtendimentoListOut, AtendimentoOut,
)

router = APIRouter(prefix="/atendimentos", tags=["Atendimentos"])


def _uc(db: Session = Depends(get_db)) -> AtendimentoUseCases:
    return AtendimentoUseCases(
        repository=SqlAlchemyAtendimentoRepository(db),
        cliente_repository=SqlAlchemyClienteRepository(db),
        obra_repository=SqlAlchemyObraRepository(db),
    )


@router.get("", response_model=AtendimentoListOut)
def listar(
    empresa_id: UUID = Depends(get_empresa_id),
    uc: AtendimentoUseCases = Depends(_uc),
    cliente_id: UUID | None = None,
    obra_id: UUID | None = None,
    status: StatusAtendimento | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    items, total = uc.listar(empresa_id, cliente_id, obra_id, status, page, page_size)
    return AtendimentoListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/{atendimento_id}", response_model=AtendimentoOut)
def obter(
    atendimento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    uc: AtendimentoUseCases = Depends(_uc),
):
    return uc.obter(empresa_id, atendimento_id)


@router.post("", response_model=AtendimentoOut, status_code=201)
def criar(
    body: AtendimentoIn,
    empresa_id: UUID = Depends(get_empresa_id),
    uc: AtendimentoUseCases = Depends(_uc),
):
    return uc.criar(
        empresa_id=empresa_id,
        cliente_id=body.cliente_id, obra_id=body.obra_id,
        tipo=body.tipo, status_val=body.status,
        data=body.data, hora=body.hora,
        responsavel=body.responsavel, descricao=body.descricao,
        checklist=body.checklist, observacoes=body.observacoes,
    )


@router.put("/{atendimento_id}", response_model=AtendimentoOut)
def atualizar(
    atendimento_id: UUID,
    body: AtendimentoIn,
    empresa_id: UUID = Depends(get_empresa_id),
    uc: AtendimentoUseCases = Depends(_uc),
):
    return uc.atualizar(
        empresa_id=empresa_id, atendimento_id=atendimento_id,
        cliente_id=body.cliente_id, obra_id=body.obra_id,
        tipo=body.tipo, status_val=body.status,
        data=body.data, hora=body.hora,
        responsavel=body.responsavel, descricao=body.descricao,
        checklist=body.checklist, checklist_ok=body.checklist_ok,
        fotos=body.fotos, assinatura_url=body.assinatura_url,
        observacoes=body.observacoes,
    )


@router.delete("/{atendimento_id}", status_code=204)
def remover(
    atendimento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    uc: AtendimentoUseCases = Depends(_uc),
):
    uc.remover(empresa_id, atendimento_id)
