"""
Endpoints REST do módulo Clientes.
Camada: Presentation — converte HTTP <-> casos de uso, sem regra de negócio aqui.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.application.use_cases.cliente_use_cases import ClienteUseCases
from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
from app.presentation.schemas.cliente import ClienteCreate, ClienteListOut, ClienteOut, ClienteUpdate

router = APIRouter(prefix="/clientes", tags=["Clientes"])


def _get_use_cases(db: Session = Depends(get_db)) -> ClienteUseCases:
    return ClienteUseCases(SqlAlchemyClienteRepository(db))


@router.get("", response_model=ClienteListOut)
def listar_clientes(
    search: str | None = Query(None, description="Busca por nome ou documento"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ClienteUseCases = Depends(_get_use_cases),
):
    itens, total = use_cases.listar(empresa_id, search, page, page_size)
    return ClienteListOut(
        items=[ClienteOut.model_validate(c) for c in itens],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{cliente_id}", response_model=ClienteOut)
def obter_cliente(
    cliente_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ClienteUseCases = Depends(_get_use_cases),
):
    return use_cases.obter(empresa_id, cliente_id)


@router.post("", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
def criar_cliente(
    payload: ClienteCreate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ClienteUseCases = Depends(_get_use_cases),
):
    return use_cases.criar(
        empresa_id=empresa_id,
        nome=payload.nome,
        documento=payload.documento,
        email=payload.email,
        telefone=payload.telefone,
        endereco=payload.endereco,
        observacoes=payload.observacoes,
    )


@router.put("/{cliente_id}", response_model=ClienteOut)
def atualizar_cliente(
    cliente_id: UUID,
    payload: ClienteUpdate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ClienteUseCases = Depends(_get_use_cases),
):
    return use_cases.atualizar(
        empresa_id=empresa_id,
        cliente_id=cliente_id,
        nome=payload.nome,
        documento=payload.documento,
        email=payload.email,
        telefone=payload.telefone,
        endereco=payload.endereco,
        observacoes=payload.observacoes,
    )


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_cliente(
    cliente_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ClienteUseCases = Depends(_get_use_cases),
):
    use_cases.remover(empresa_id, cliente_id)
