"""
Endpoints da própria empresa (configurações), incluindo a logo.
Camada: Presentation.

A logo é enviada pelo FRONTEND diretamente ao Supabase Storage (mesmo padrão
já usado em Documentos) — o backend nunca recebe o arquivo em si, só grava o
CAMINHO no Storage. A URL assinada é sempre gerada na hora da leitura, nunca
guardada fixa (URLs assinadas expiram).

Isolamento multi-tenant: toda operação usa get_empresa_id (o id da empresa
do usuário autenticado) — nunca um id vindo do corpo da requisição. Isso
torna estruturalmente impossível uma empresa ler ou trocar a logo de outra.
"""
from __future__ import annotations
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from supabase import create_client

from app.core.config import get_settings
from app.core.security import get_empresa_id, get_current_user, CurrentUser
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.empresa import EmpresaModel

router = APIRouter(prefix="/empresa", tags=["Empresa"])

BUCKET = "documentos"  # reaproveita o bucket já existente — políticas checam só o bucket, não a pasta


def _exige_admin(user: CurrentUser) -> None:
    if user.papel != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem realizar esta ação.")


def _url_assinada(logo_path: str | None) -> str | None:
    if not logo_path:
        return None
    settings = get_settings()
    admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    try:
        resultado = admin.storage.from_(BUCKET).create_signed_url(logo_path, 365 * 24 * 60 * 60)
        return resultado.get("signedURL") or resultado.get("signedUrl")
    except Exception:
        # Arquivo pode ter sido apagado direto no Storage por fora do app —
        # não derruba a tela de configurações por causa disso.
        return None


class EmpresaOut(BaseModel):
    id: UUID
    nome: str
    cnpj: str
    email: str | None
    telefone: str | None
    logo_url: str | None


class LogoIn(BaseModel):
    logo_path: str = Field(min_length=1, max_length=500)

    @field_validator("logo_path")
    @classmethod
    def _validar_pasta(cls, v: str) -> str:
        # Defesa em profundidade: mesmo que o front tenha um bug, o backend
        # nunca aceita gravar um caminho fora da pasta esperada de logos.
        if not v.startswith("logo-empresa/"):
            raise ValueError("Caminho de logo inválido.")
        return v


@router.get("/me", response_model=EmpresaOut)
def obter_minha_empresa(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    return EmpresaOut(
        id=empresa.id, nome=empresa.nome, cnpj=empresa.cnpj,
        email=empresa.email, telefone=empresa.telefone,
        logo_url=_url_assinada(empresa.logo_path),
    )


@router.put("/me/logo", response_model=EmpresaOut)
def atualizar_logo(
    body: LogoIn,
    empresa_id: UUID = Depends(get_empresa_id),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _exige_admin(current_user)
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    caminho_antigo = empresa.logo_path
    empresa.logo_path = body.logo_path
    db.commit()
    db.refresh(empresa)

    # Limpa o arquivo antigo do Storage (senão acumula lixo a cada troca de
    # logo) — melhor esforço: se falhar, não derruba a resposta, já que a
    # troca em si já foi concluída com sucesso.
    if caminho_antigo and caminho_antigo != body.logo_path:
        try:
            settings = get_settings()
            admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            admin.storage.from_(BUCKET).remove([caminho_antigo])
        except Exception:
            pass

    return EmpresaOut(
        id=empresa.id, nome=empresa.nome, cnpj=empresa.cnpj,
        email=empresa.email, telefone=empresa.telefone,
        logo_url=_url_assinada(empresa.logo_path),
    )


@router.delete("/me/logo", response_model=EmpresaOut)
def remover_logo(
    empresa_id: UUID = Depends(get_empresa_id),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _exige_admin(current_user)
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    if empresa.logo_path:
        try:
            settings = get_settings()
            admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            admin.storage.from_(BUCKET).remove([empresa.logo_path])
        except Exception:
            pass
        empresa.logo_path = None
        db.commit()
        db.refresh(empresa)

    return EmpresaOut(
        id=empresa.id, nome=empresa.nome, cnpj=empresa.cnpj,
        email=empresa.email, telefone=empresa.telefone,
        logo_url=None,
    )
