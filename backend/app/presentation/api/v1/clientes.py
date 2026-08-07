"""
Endpoints REST do módulo Clientes.
Camada: Presentation.
"""
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ClienteUseCases = Depends(_get_use_cases),
):
    itens, total = use_cases.listar(empresa_id, search, page, page_size)
    return ClienteListOut(
        items=[ClienteOut.model_validate(c) for c in itens],
        total=total, page=page, page_size=page_size,
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
        nome=payload.nome, documento=payload.documento,
        email=payload.email, telefone=payload.telefone,
        whatsapp=payload.whatsapp, rg=payload.rg,
        sexo=payload.sexo, data_nascimento=payload.data_nascimento,
        cep=payload.cep, logradouro=payload.logradouro,
        numero=payload.numero, complemento=payload.complemento,
        bairro=payload.bairro, cidade=payload.cidade, estado=payload.estado,
        endereco=payload.endereco, observacoes=payload.observacoes,
    )


@router.put("/{cliente_id}", response_model=ClienteOut)
def atualizar_cliente(
    cliente_id: UUID,
    payload: ClienteUpdate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ClienteUseCases = Depends(_get_use_cases),
):
    return use_cases.atualizar(
        empresa_id=empresa_id, cliente_id=cliente_id,
        nome=payload.nome, documento=payload.documento,
        email=payload.email, telefone=payload.telefone,
        whatsapp=payload.whatsapp, rg=payload.rg,
        sexo=payload.sexo, data_nascimento=payload.data_nascimento,
        cep=payload.cep, logradouro=payload.logradouro,
        numero=payload.numero, complemento=payload.complemento,
        bairro=payload.bairro, cidade=payload.cidade, estado=payload.estado,
        endereco=payload.endereco, observacoes=payload.observacoes,
    )


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_cliente(
    cliente_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ClienteUseCases = Depends(_get_use_cases),
):
    use_cases.remover(empresa_id, cliente_id)


@router.get("/cep/{cep}")
def buscar_cep(cep: str, _: UUID = Depends(get_empresa_id)):
    """Consulta o ViaCEP e retorna os dados de endereço. Requer autenticação."""
    digitos = "".join(c for c in cep if c.isdigit())
    if len(digitos) != 8:
        raise HTTPException(status_code=400, detail="CEP deve ter 8 dígitos.")
    try:
        response = httpx.get(f"https://viacep.com.br/ws/{digitos}/json/", timeout=5.0)
        if response.is_success:
            data = response.json()
            if data.get("erro"):
                raise HTTPException(status_code=404, detail="CEP não encontrado.")
            return {
                "cep": digitos,
                "logradouro": data.get("logradouro"),
                "bairro": data.get("bairro"),
                "cidade": data.get("localidade"),
                "estado": data.get("uf"),
            }
    except httpx.HTTPError:
        pass
    raise HTTPException(status_code=503, detail="Serviço de CEP indisponível.")
