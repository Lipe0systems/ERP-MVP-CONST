"""Repositório SQLAlchemy de ConviteUsuario. Camada: Infrastructure."""
from __future__ import annotations
import uuid
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.convite import ConviteUsuario, PapelUsuario, StatusConvite
from app.infrastructure.database.models.convite import ConviteUsuarioModel


def _to_entity(m: ConviteUsuarioModel) -> ConviteUsuario:
    return ConviteUsuario(
        id=m.id, empresa_id=m.empresa_id, email=m.email,
        papel=PapelUsuario(m.papel), token=m.token,
        status=StatusConvite(m.status), criado_por_id=m.criado_por_id,
        criado_em=m.criado_em, expira_em=m.expira_em,
    )


class ConviteRepository:
    def __init__(self, db: Session): self.db = db

    def list(self, empresa_id: UUID) -> list[ConviteUsuario]:
        rows = self.db.query(ConviteUsuarioModel).filter(
            ConviteUsuarioModel.empresa_id == empresa_id
        ).order_by(ConviteUsuarioModel.criado_em.desc()).all()
        return [_to_entity(r) for r in rows]

    def get_by_token(self, token: str) -> ConviteUsuario | None:
        m = self.db.query(ConviteUsuarioModel).filter(
            ConviteUsuarioModel.token == token
        ).first()
        return _to_entity(m) if m else None

    def get_by_id(self, empresa_id: UUID, convite_id: UUID) -> ConviteUsuario | None:
        m = self.db.query(ConviteUsuarioModel).filter(
            ConviteUsuarioModel.empresa_id == empresa_id,
            ConviteUsuarioModel.id == convite_id,
        ).first()
        return _to_entity(m) if m else None

    def create(self, empresa_id: UUID, email: str, papel: PapelUsuario,
               criado_por_id: UUID | None) -> ConviteUsuario:
        token = uuid.uuid4().hex + uuid.uuid4().hex  # 64 chars
        m = ConviteUsuarioModel(
            id=uuid.uuid4(), empresa_id=empresa_id,
            email=email.lower().strip(), papel=papel.value,
            token=token, status=StatusConvite.PENDENTE.value,
            criado_por_id=criado_por_id,
            expira_em=datetime.utcnow() + timedelta(days=7),
        )
        self.db.add(m); self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def atualizar_status(self, convite_id: UUID, status: StatusConvite) -> None:
        m = self.db.query(ConviteUsuarioModel).filter(
            ConviteUsuarioModel.id == convite_id
        ).first()
        if m:
            m.status = status.value
            self.db.commit()

    def delete(self, empresa_id: UUID, convite_id: UUID) -> bool:
        m = self.db.query(ConviteUsuarioModel).filter(
            ConviteUsuarioModel.empresa_id == empresa_id,
            ConviteUsuarioModel.id == convite_id,
        ).first()
        if not m: return False
        self.db.delete(m); self.db.commit()
        return True
