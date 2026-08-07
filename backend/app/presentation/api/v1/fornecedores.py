"""Endpoints REST do módulo Fornecedores. Camada: Presentation."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.application.use_cases.fornecedor_use_cases import FornecedorUseCases
from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.fornecedor_repository import SqlAlchemyFornecedorRepository
from app.presentation.schemas.fornecedor import FornecedorCreate, FornecedorListOut, FornecedorOut, FornecedorUpdate

router = APIRouter(prefix="/fornecedores", tags=["Fornecedores"])


def _get_use_cases(db: Session = Depends(get_db)) -> FornecedorUseCases:
    return FornecedorUseCases(SqlAlchemyFornecedorRepository(db))


@router.get("", response_model=FornecedorListOut)
def listar(empresa_id: UUID = Depends(get_empresa_id), uc: FornecedorUseCases = Depends(_get_use_cases),
           search: str | None = None, page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100)):
    items, total = uc.listar(empresa_id, search, page, page_size)
    return FornecedorListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/{fornecedor_id}", response_model=FornecedorOut)
def obter(fornecedor_id: UUID, empresa_id: UUID = Depends(get_empresa_id), uc: FornecedorUseCases = Depends(_get_use_cases)):
    return uc.obter(empresa_id, fornecedor_id)


@router.post("", response_model=FornecedorOut, status_code=201)
def criar(body: FornecedorCreate, empresa_id: UUID = Depends(get_empresa_id), uc: FornecedorUseCases = Depends(_get_use_cases)):
    return uc.criar(empresa_id, body.nome, body.documento, body.email, body.telefone, body.endereco, body.observacoes)


@router.put("/{fornecedor_id}", response_model=FornecedorOut)
def atualizar(fornecedor_id: UUID, body: FornecedorUpdate, empresa_id: UUID = Depends(get_empresa_id), uc: FornecedorUseCases = Depends(_get_use_cases)):
    return uc.atualizar(empresa_id, fornecedor_id, body.nome, body.documento, body.email, body.telefone, body.endereco, body.observacoes)


@router.delete("/{fornecedor_id}", status_code=204)
def remover(fornecedor_id: UUID, empresa_id: UUID = Depends(get_empresa_id), uc: FornecedorUseCases = Depends(_get_use_cases)):
    uc.remover(empresa_id, fornecedor_id)
