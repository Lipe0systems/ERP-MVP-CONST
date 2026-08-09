"""
Endpoints do módulo Usuários — listagem, convites e gestão de papéis.

Fluxo de convite:
  1. Admin POST /usuarios/convites         → cria convite com token (7 dias)
  2. Admin vê o link de aceite no response
  3. Novo usuário GET /usuarios/convites/{token} → valida token
  4. Novo usuário POST /usuarios/convites/{token}/aceitar → cria conta no Supabase
     Auth via Admin API e vincula à empresa
  5. Usuário faz login normalmente

Papéis disponíveis: admin, membro, visualizador
Camada: Presentation.
"""
from __future__ import annotations
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_empresa_id, CurrentUser
from app.domain.entities.convite import PapelUsuario, StatusConvite
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.usuario import UsuarioModel
from app.infrastructure.repositories.convite_repository import ConviteRepository

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

# ─── Schemas ──────────────────────────────────────────────────────────────────

class ConviteCreateIn(BaseModel):
    email: EmailStr
    papel: PapelUsuario = PapelUsuario.MEMBRO


class PapelUpdateIn(BaseModel):
    papel: PapelUsuario


class UsuarioOut(BaseModel):
    id: UUID
    nome: str
    email: str
    papel: str
    ativo: bool


class ConviteOut(BaseModel):
    id: UUID
    email: str
    papel: str
    status: str
    expira_em: datetime
    link_aceite: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _exige_admin(user: CurrentUser) -> None:
    if getattr(user, "papel", "membro") not in ("admin",):
        raise HTTPException(status_code=403, detail="Apenas administradores podem realizar esta ação.")


def _convite_to_out(c, base_url: str = "") -> ConviteOut:
    return ConviteOut(
        id=c.id, email=c.email, papel=c.papel.value,
        status=c.status.value, expira_em=c.expira_em,
        link_aceite=f"{base_url}/aceitar-convite?token={c.token}",
    )


# ─── Endpoints de Usuários ────────────────────────────────────────────────────

@router.get("", response_model=list[UsuarioOut])
def listar_usuarios(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    rows = db.query(UsuarioModel).filter(
        UsuarioModel.empresa_id == empresa_id,
        UsuarioModel.ativo == True,
    ).order_by(UsuarioModel.nome).all()
    return [UsuarioOut(id=r.id, nome=r.nome, email=r.email, papel=r.papel, ativo=r.ativo) for r in rows]


@router.patch("/{usuario_id}/papel", response_model=UsuarioOut)
def atualizar_papel(
    usuario_id: UUID,
    body: PapelUpdateIn,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    _exige_admin(current_user)
    if usuario_id == current_user.id:
        raise HTTPException(status_code=422, detail="Você não pode alterar seu próprio papel.")
    m = db.query(UsuarioModel).filter(
        UsuarioModel.empresa_id == empresa_id,
        UsuarioModel.id == usuario_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    m.papel = body.papel.value
    db.commit(); db.refresh(m)
    return UsuarioOut(id=m.id, nome=m.nome, email=m.email, papel=m.papel, ativo=m.ativo)


@router.delete("/{usuario_id}", status_code=204)
def remover_usuario(
    usuario_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    _exige_admin(current_user)
    if usuario_id == current_user.id:
        raise HTTPException(status_code=422, detail="Você não pode remover a si mesmo.")
    m = db.query(UsuarioModel).filter(
        UsuarioModel.empresa_id == empresa_id,
        UsuarioModel.id == usuario_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    m.ativo = False
    db.commit()


# ─── Endpoints de Convites ────────────────────────────────────────────────────

@router.get("/convites", response_model=list[ConviteOut])
def listar_convites(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    _exige_admin(current_user)
    repo = ConviteRepository(db)
    convites = repo.list(empresa_id)
    return [_convite_to_out(c) for c in convites]


@router.post("/convites", response_model=ConviteOut, status_code=201)
def criar_convite(
    body: ConviteCreateIn,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    _exige_admin(current_user)
    # Verificar se já existe usuário ativo com esse e-mail na empresa
    ja_existe = db.query(UsuarioModel).filter(
        UsuarioModel.empresa_id == empresa_id,
        UsuarioModel.email == body.email.lower(),
        UsuarioModel.ativo == True,
    ).first()
    if ja_existe:
        raise HTTPException(status_code=422, detail="Já existe um usuário ativo com este e-mail nesta empresa.")

    repo = ConviteRepository(db)
    # Cancelar convites pendentes anteriores para o mesmo e-mail
    convites_anteriores = [
        c for c in repo.list(empresa_id)
        if c.email == body.email.lower() and c.status == StatusConvite.PENDENTE
    ]
    for c in convites_anteriores:
        repo.atualizar_status(c.id, StatusConvite.CANCELADO)

    convite = repo.create(
        empresa_id=empresa_id,
        email=body.email,
        papel=body.papel,
        criado_por_id=current_user.id,
    )
    return _convite_to_out(convite)


@router.get("/convites/{token}/validar")
def validar_token(token: str, db: Session = Depends(get_db)):
    """Verifica se um token de convite é válido (sem autenticação — página pública)."""
    repo = ConviteRepository(db)
    convite = repo.get_by_token(token)
    if not convite:
        raise HTTPException(status_code=404, detail="Convite não encontrado.")
    if convite.status != StatusConvite.PENDENTE:
        raise HTTPException(status_code=422, detail=f"Convite {convite.status.value}.")
    if convite.expira_em < datetime.utcnow():
        repo.atualizar_status(convite.id, StatusConvite.EXPIRADO)
        raise HTTPException(status_code=422, detail="Convite expirado.")
    return {
        "valido": True,
        "email": convite.email,
        "papel": convite.papel.value,
        "expira_em": convite.expira_em.isoformat(),
    }


@router.delete("/convites/{convite_id}", status_code=204)
def cancelar_convite(
    convite_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    _exige_admin(current_user)
    repo = ConviteRepository(db)
    convite = repo.get_by_id(empresa_id, convite_id)
    if not convite:
        raise HTTPException(status_code=404, detail="Convite não encontrado.")
    repo.atualizar_status(convite_id, StatusConvite.CANCELADO)
