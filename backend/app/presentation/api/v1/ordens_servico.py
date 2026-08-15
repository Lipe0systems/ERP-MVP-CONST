"""
Endpoints do módulo Ordens de Serviço.
Camada: Presentation.

Regra de acesso central: um usuário com papel "instalador" só pode ver e
concluir as ordens atribuídas a ELE MESMO — nunca lista todas, nunca vê de
outro instalador, nunca acessa criar/editar/apagar (isso é privilégio de
admin/membro). O bloqueio de MÓDULOS inteiros fora de Ordens de Serviço
para o papel instalador não vive aqui — está centralizado em
core/security.py (get_current_user), para não precisar repetir a mesma
checagem em cada um dos ~30 routers do sistema.
"""
from __future__ import annotations
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id, get_current_user, CurrentUser
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.ordem_servico_repository import SqlAlchemyOrdemServicoRepository
from app.domain.entities.ordem_servico import OrdemServico, StatusOrdemServico
from app.presentation.schemas.ordem_servico import (
    OrdemServicoCreateIn, OrdemServicoUpdateIn, ConcluirOrdemServicoIn,
    OrdemServicoOut, OrdemServicoListOut,
)

router = APIRouter(prefix="/ordens-servico", tags=["Ordens de Serviço"])


def _repo(db: Session = Depends(get_db)) -> SqlAlchemyOrdemServicoRepository:
    return SqlAlchemyOrdemServicoRepository(db)


def _pertence_ao_instalador(current_user: CurrentUser, instalador_id) -> bool:
    return current_user.papel != "instalador" or str(instalador_id) == current_user.id


@router.get("", response_model=OrdemServicoListOut)
def listar(
    status_filtro: StatusOrdemServico | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    current_user: CurrentUser = Depends(get_current_user),
    repo: SqlAlchemyOrdemServicoRepository = Depends(_repo),
):
    """
    Um instalador só recebe as ordens atribuídas a ele mesmo — o filtro é
    aplicado aqui, não é opcional nem vem de parâmetro do cliente (senão
    bastaria omitir o parâmetro para ver tudo).
    """
    instalador_id = UUID(current_user.id) if current_user.papel == "instalador" else None
    items, total = repo.list(
        empresa_id, instalador_id=instalador_id, status=status_filtro,
        page=page, page_size=page_size,
    )
    return OrdemServicoListOut(
        items=[OrdemServicoOut(**i) for i in items], total=total, page=page, page_size=page_size,
    )


@router.get("/{ordem_id}", response_model=OrdemServicoOut)
def obter(
    ordem_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    current_user: CurrentUser = Depends(get_current_user),
    repo: SqlAlchemyOrdemServicoRepository = Depends(_repo),
):
    encontrada = repo.get_by_id_com_nomes(empresa_id, ordem_id)
    if not encontrada:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada.")
    if not _pertence_ao_instalador(current_user, encontrada["instalador_id"]):
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada.")
    return OrdemServicoOut(**encontrada)


@router.post("", response_model=OrdemServicoOut, status_code=status.HTTP_201_CREATED)
def criar(
    body: OrdemServicoCreateIn,
    empresa_id: UUID = Depends(get_empresa_id),
    current_user: CurrentUser = Depends(get_current_user),
    repo: SqlAlchemyOrdemServicoRepository = Depends(_repo),
):
    if current_user.papel == "instalador":
        raise HTTPException(status_code=403, detail="Instaladores não podem criar ordens de serviço.")

    numero = repo.next_numero(empresa_id)
    nova = OrdemServico(
        id=uuid.uuid4(), empresa_id=empresa_id, numero=numero,
        titulo=body.titulo, descricao=body.descricao,
        cliente_id=body.cliente_id, obra_id=body.obra_id,
        instalador_id=body.instalador_id, endereco=body.endereco,
        data_agendada=body.data_agendada,
    )
    criada = repo.create(nova)
    return OrdemServicoOut(**repo.get_by_id_com_nomes(empresa_id, criada.id))


@router.put("/{ordem_id}", response_model=OrdemServicoOut)
def atualizar(
    ordem_id: UUID,
    body: OrdemServicoUpdateIn,
    empresa_id: UUID = Depends(get_empresa_id),
    current_user: CurrentUser = Depends(get_current_user),
    repo: SqlAlchemyOrdemServicoRepository = Depends(_repo),
):
    if current_user.papel == "instalador":
        raise HTTPException(status_code=403, detail="Instaladores não podem editar ordens de serviço.")

    existente = repo.get_by_id(empresa_id, ordem_id)
    if not existente:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada.")

    existente.titulo = body.titulo
    existente.descricao = body.descricao
    existente.cliente_id = body.cliente_id
    existente.obra_id = body.obra_id
    existente.instalador_id = body.instalador_id
    existente.endereco = body.endereco
    existente.data_agendada = body.data_agendada
    if body.status:
        existente.status = body.status

    atualizada = repo.update(existente)
    return OrdemServicoOut(**repo.get_by_id_com_nomes(empresa_id, atualizada.id))


@router.post("/{ordem_id}/concluir", response_model=OrdemServicoOut)
def concluir(
    ordem_id: UUID,
    body: ConcluirOrdemServicoIn,
    empresa_id: UUID = Depends(get_empresa_id),
    current_user: CurrentUser = Depends(get_current_user),
    repo: SqlAlchemyOrdemServicoRepository = Depends(_repo),
):
    """
    A ação principal do instalador: marca como concluída com foto
    obrigatória. Admin/membro também podem usar, mas um instalador só
    pode concluir a PRÓPRIA ordem.
    """
    encontrada = repo.get_by_id_com_nomes(empresa_id, ordem_id)
    if not encontrada:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada.")
    if not _pertence_ao_instalador(current_user, encontrada["instalador_id"]):
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada.")

    repo.marcar_concluida(
        empresa_id, ordem_id,
        foto_conclusao_url=body.foto_conclusao_url, observacoes=body.observacoes,
    )
    return OrdemServicoOut(**repo.get_by_id_com_nomes(empresa_id, ordem_id))


@router.delete("/{ordem_id}", status_code=204)
def apagar(
    ordem_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    current_user: CurrentUser = Depends(get_current_user),
    repo: SqlAlchemyOrdemServicoRepository = Depends(_repo),
):
    if current_user.papel == "instalador":
        raise HTTPException(status_code=403, detail="Instaladores não podem apagar ordens de serviço.")
    if not repo.delete(empresa_id, ordem_id):
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada.")
