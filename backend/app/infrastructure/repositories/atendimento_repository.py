from __future__ import annotations
"""Implementação SQLAlchemy do AtendimentoRepository. Camada: Infrastructure."""
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domain.entities.atendimento import Atendimento, StatusAtendimento, TipoAtendimento
from app.domain.repositories.atendimento_repository import AtendimentoRepository
from app.infrastructure.database.models.atendimento import AtendimentoModel
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.soft_delete import soft_delete


def _to_entity(m: AtendimentoModel) -> Atendimento:
    return Atendimento(
        id=m.id, empresa_id=m.empresa_id,
        cliente_id=m.cliente_id, obra_id=m.obra_id,
        tipo=TipoAtendimento(m.tipo), status=StatusAtendimento(m.status),
        data=m.data, hora=m.hora, responsavel=m.responsavel,
        descricao=m.descricao,
        checklist=list(m.checklist or []),
        checklist_ok=list(m.checklist_ok or []),
        fotos=list(m.fotos or []),
        assinatura_url=m.assinatura_url,
        observacoes=m.observacoes,
        criado_em=m.criado_em,
    )


class SqlAlchemyAtendimentoRepository(AtendimentoRepository):
    def __init__(self, db: Session): self.db = db

    def list(
        self, empresa_id: UUID, cliente_id: UUID | None,
        obra_id: UUID | None, status: StatusAtendimento | None,
        page: int, page_size: int,
    ) -> tuple[list[dict], int]:
        q = (
            self.db.query(AtendimentoModel, ClienteModel.nome, ObraModel.nome)
            .join(ClienteModel, ClienteModel.id == AtendimentoModel.cliente_id)
            .outerjoin(ObraModel, ObraModel.id == AtendimentoModel.obra_id)
            .filter(AtendimentoModel.empresa_id == empresa_id)
        )
        if cliente_id: q = q.filter(AtendimentoModel.cliente_id == cliente_id)
        if obra_id: q = q.filter(AtendimentoModel.obra_id == obra_id)
        if status: q = q.filter(AtendimentoModel.status == status.value)

        total = q.with_entities(func.count(AtendimentoModel.id)).scalar() or 0
        rows = q.order_by(AtendimentoModel.data.desc(), AtendimentoModel.criado_em.desc()).offset((page - 1) * page_size).limit(page_size).all()

        items = []
        for atend, cliente_nome, obra_nome in rows:
            items.append({
                "id": atend.id, "empresa_id": atend.empresa_id,
                "cliente_id": atend.cliente_id, "cliente_nome": cliente_nome,
                "obra_id": atend.obra_id, "obra_nome": obra_nome,
                "tipo": atend.tipo, "status": atend.status,
                "data": atend.data, "hora": atend.hora,
                "responsavel": atend.responsavel, "descricao": atend.descricao,
                "checklist": list(atend.checklist or []),
                "checklist_ok": list(atend.checklist_ok or []),
                "fotos": list(atend.fotos or []),
                "assinatura_url": atend.assinatura_url,
                "observacoes": atend.observacoes,
                "criado_em": atend.criado_em,
            })
        return items, total

    def get_by_id(self, empresa_id: UUID, atendimento_id: UUID) -> Atendimento | None:
        m = self.db.query(AtendimentoModel).filter(
            AtendimentoModel.empresa_id == empresa_id,
            AtendimentoModel.id == atendimento_id,
        ).first()
        return _to_entity(m) if m else None

    def create(self, a: Atendimento) -> Atendimento:
        m = AtendimentoModel(
            id=a.id, empresa_id=a.empresa_id, cliente_id=a.cliente_id,
            obra_id=a.obra_id, tipo=a.tipo.value, status=a.status.value,
            data=a.data, hora=a.hora, responsavel=a.responsavel,
            descricao=a.descricao, checklist=a.checklist,
            checklist_ok=a.checklist_ok, fotos=a.fotos,
            assinatura_url=a.assinatura_url, observacoes=a.observacoes,
        )
        self.db.add(m); self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def update(self, a: Atendimento) -> Atendimento:
        m = self.db.query(AtendimentoModel).filter(
            AtendimentoModel.empresa_id == a.empresa_id,
            AtendimentoModel.id == a.id,
        ).first()
        if not m: raise ValueError("Atendimento não encontrado")
        m.cliente_id = a.cliente_id; m.obra_id = a.obra_id
        m.tipo = a.tipo.value; m.status = a.status.value
        m.data = a.data; m.hora = a.hora; m.responsavel = a.responsavel
        m.descricao = a.descricao; m.checklist = a.checklist
        m.checklist_ok = a.checklist_ok; m.fotos = a.fotos
        m.assinatura_url = a.assinatura_url; m.observacoes = a.observacoes
        self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def delete(self, empresa_id: UUID, atendimento_id: UUID) -> bool:
        m = self.db.query(AtendimentoModel).filter(
            AtendimentoModel.empresa_id == empresa_id,
            AtendimentoModel.id == atendimento_id,
        ).first()
        if not m: return False
        soft_delete(self.db, m)
        return True
