"""
Endpoints do módulo Usuários — listagem, convites e gestão de papéis.

Fluxo de convite:
  1. Admin POST /usuarios/convites         → cria convite com token (7 dias)
  2. Admin vê o link de aceite no response
  3. Novo usuário GET /usuarios/convites/{token}/validar → valida token
  4. Novo usuário POST /usuarios/convites/{token}/aceitar → cria conta no Supabase
     Auth via Admin API (empresa_id em app_metadata, não editável pelo usuário)
     e espelha na tabela `usuarios`
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

from app.core.security import get_current_user, get_empresa_id, exigir_admin, CurrentUser
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
    if user.papel != "admin":
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


class AceitarConviteIn(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    senha: str = Field(min_length=8, max_length=72)
    aceitou_termos: bool = Field(
        default=False,
        description="Precisa ser true — a criação da conta é recusada sem o aceite explícito.",
    )


@router.post("/convites/{token}/aceitar", status_code=201)
def aceitar_convite(token: str, body: AceitarConviteIn, db: Session = Depends(get_db)):
    """
    Finaliza o convite: cria a conta no Supabase Auth (via Admin API,
    service_role — nunca exposta ao navegador) e espelha o usuário na
    tabela `usuarios`, que é a fonte da verdade de empresa/papel usada
    em toda autenticação (ver core/security.py). Sem autenticação prévia
    — é a página pública que o convidado usa antes de ter conta.
    """
    import uuid as _uuid
    import httpx as _httpx

    from app.core.config import get_settings

    repo = ConviteRepository(db)
    convite = repo.get_by_token(token)
    if not convite:
        raise HTTPException(status_code=404, detail="Convite não encontrado.")
    if convite.status != StatusConvite.PENDENTE:
        raise HTTPException(status_code=422, detail=f"Convite {convite.status.value}.")
    if convite.expira_em < datetime.utcnow():
        repo.atualizar_status(convite.id, StatusConvite.EXPIRADO)
        raise HTTPException(status_code=422, detail="Convite expirado.")

    if not body.aceitou_termos:
        raise HTTPException(
            status_code=422,
            detail="É necessário aceitar os Termos de Uso e a Política de Privacidade para criar a conta.",
        )

    ja_existe = db.query(UsuarioModel).filter(
        UsuarioModel.empresa_id == convite.empresa_id,
        UsuarioModel.email == convite.email.lower(),
        UsuarioModel.ativo == True,
    ).first()
    if ja_existe:
        raise HTTPException(status_code=422, detail="Já existe um usuário ativo com este e-mail nesta empresa.")

    settings = get_settings()

    # Cria a conta no Supabase Auth. empresa_id vai em app_metadata (só
    # gravável com a service_role key) — NUNCA em user_metadata, que o
    # próprio usuário poderia reescrever depois de logado (era exatamente
    # a falha corrigida em core/security.py).
    try:
        resp = _httpx.post(
            f"{settings.SUPABASE_URL}/auth/v1/admin/users",
            json={
                "email": convite.email.strip().lower(),
                "password": body.senha,
                "email_confirm": True,
                "app_metadata": {"empresa_id": str(convite.empresa_id)},
                "user_metadata": {"full_name": body.nome.strip()},
            },
            headers={
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
            timeout=15.0,
        )
    except _httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Não foi possível criar a conta no serviço de autenticação.") from exc

    if resp.status_code == 422:
        data = resp.json()
        raise HTTPException(status_code=409, detail=data.get("msg") or data.get("message") or "E-mail já cadastrado.")
    if not resp.is_success:
        raise HTTPException(status_code=502, detail=f"Erro ao criar usuário: {resp.text[:200]}")

    auth_user_id = _uuid.UUID(resp.json()["id"])

    usuario = UsuarioModel(
        id=auth_user_id,
        empresa_id=convite.empresa_id,
        nome=body.nome.strip(),
        email=convite.email.strip().lower(),
        papel=convite.papel.value,
        ativo=True,
        termos_aceitos_em=datetime.utcnow(),
        termos_versao=VERSAO_TERMOS_ATUAL,
    )
    db.add(usuario)
    # atualizar_status faz o commit internamente, o que grava o usuário acima
    # na MESMA transação — é justamente o que queremos: ou o usuário é criado
    # e o convite é marcado como aceito juntos, ou nada acontece (evita que um
    # convite fique reutilizável depois de já ter criado a conta). O commit
    # abaixo é uma rede de segurança para o caso de atualizar_status não ter
    # encontrado o convite (não deveria: já foi validado no início).
    repo.atualizar_status(convite.id, StatusConvite.ACEITO)
    db.commit()

    # Login automático, igual ao onboarding — devolve os tokens para o
    # frontend já entrar autenticado.
    try:
        login_resp = _httpx.post(
            f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password",
            json={"email": convite.email, "password": body.senha},
            headers={"apikey": settings.SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            timeout=15.0,
        )
        tokens = login_resp.json() if login_resp.is_success else {}
    except _httpx.HTTPError:
        tokens = {}

    return {
        "mensagem": "Conta criada com sucesso.",
        "empresa_id": str(convite.empresa_id),
        "access_token": tokens.get("access_token"),
        "refresh_token": tokens.get("refresh_token"),
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


# ═══ Aceite dos Termos de Uso / Política de Privacidade ═════════════════════
from app.core.termos import VERSAO_TERMOS_ATUAL


@router.get("/me/termos")
def status_aceite_termos(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Diz se o usuário logado precisa aceitar os termos (nunca aceitou, ou aceitou versão antiga)."""
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id == current_user.id).first()
    precisa_aceitar = usuario is None or usuario.termos_versao != VERSAO_TERMOS_ATUAL
    return {"precisa_aceitar": precisa_aceitar, "versao_atual": VERSAO_TERMOS_ATUAL}


@router.post("/me/aceitar-termos")
def aceitar_termos(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Registra o aceite dos Termos de Uso/Política de Privacidade pelo usuário logado, com data/hora."""
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id == current_user.id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    usuario.termos_aceitos_em = datetime.utcnow()
    usuario.termos_versao = VERSAO_TERMOS_ATUAL
    db.commit()
    return {"aceito": True, "aceito_em": usuario.termos_aceitos_em.isoformat()}
