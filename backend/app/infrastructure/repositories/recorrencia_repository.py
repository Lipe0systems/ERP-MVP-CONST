"""Implementação SQLAlchemy do RecorrenciaRepository. Camada: Infrastructure."""
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.entities.recorrencia import RecorrenciaFinanceira, TipoRecorrencia
from app.domain.repositories.recorrencia_repository import RecorrenciaRepository
from app.infrastructure.database.models.recorrencia import RecorrenciaFinanceiraModel


def _to_entity(m: RecorrenciaFinanceiraModel) -> RecorrenciaFinanceira:
    return RecorrenciaFinanceira(
        id=m.id, empresa_id=m.empresa_id, tipo=TipoRecorrencia(m.tipo),
        descricao=m.descricao, valor=float(m.valor), dia_vencimento=m.dia_vencimento,
        ativo=m.ativo, fornecedor=m.fornecedor, cliente_id=m.cliente_id,
        obra_id=m.obra_id, categoria=m.categoria, observacoes=m.observacoes,
        ultima_geracao=m.ultima_geracao, criado_em=m.criado_em,
    )


class SqlAlchemyRecorrenciaRepository(RecorrenciaRepository):
    def __init__(self, db: Session): self.db = db

    def list(self, empresa_id: UUID, ativo: bool | None) -> list[RecorrenciaFinanceira]:
        q = self.db.query(RecorrenciaFinanceiraModel).filter(RecorrenciaFinanceiraModel.empresa_id == empresa_id)
        if ativo is not None:
            q = q.filter(RecorrenciaFinanceiraModel.ativo == ativo)
        return [_to_entity(m) for m in q.order_by(RecorrenciaFinanceiraModel.descricao).all()]

    def get_by_id(self, empresa_id: UUID, recorrencia_id: UUID) -> RecorrenciaFinanceira | None:
        m = self.db.query(RecorrenciaFinanceiraModel).filter(
            RecorrenciaFinanceiraModel.empresa_id == empresa_id,
            RecorrenciaFinanceiraModel.id == recorrencia_id,
        ).first()
        return _to_entity(m) if m else None

    def list_todas_ativas(self) -> list[RecorrenciaFinanceira]:
        rows = self.db.query(RecorrenciaFinanceiraModel).filter(RecorrenciaFinanceiraModel.ativo == True).all()
        return [_to_entity(m) for m in rows]

    def create(self, r: RecorrenciaFinanceira) -> RecorrenciaFinanceira:
        m = RecorrenciaFinanceiraModel(
            id=r.id, empresa_id=r.empresa_id, tipo=r.tipo.value,
            descricao=r.descricao, valor=r.valor, dia_vencimento=r.dia_vencimento,
            ativo=r.ativo, fornecedor=r.fornecedor, cliente_id=r.cliente_id,
            obra_id=r.obra_id, categoria=r.categoria, observacoes=r.observacoes,
            ultima_geracao=r.ultima_geracao,
        )
        self.db.add(m); self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def update(self, r: RecorrenciaFinanceira) -> RecorrenciaFinanceira:
        m = self.db.query(RecorrenciaFinanceiraModel).filter(
            RecorrenciaFinanceiraModel.empresa_id == r.empresa_id,
            RecorrenciaFinanceiraModel.id == r.id,
        ).first()
        if not m: raise ValueError("Recorrência não encontrada")
        m.tipo = r.tipo.value; m.descricao = r.descricao; m.valor = r.valor
        m.dia_vencimento = r.dia_vencimento; m.ativo = r.ativo
        m.fornecedor = r.fornecedor; m.cliente_id = r.cliente_id
        m.obra_id = r.obra_id; m.categoria = r.categoria
        m.observacoes = r.observacoes; m.ultima_geracao = r.ultima_geracao
        self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def delete(self, empresa_id: UUID, recorrencia_id: UUID) -> bool:
        m = self.db.query(RecorrenciaFinanceiraModel).filter(
            RecorrenciaFinanceiraModel.empresa_id == empresa_id,
            RecorrenciaFinanceiraModel.id == recorrencia_id,
        ).first()
        if not m: return False
        self.db.delete(m); self.db.commit()
        return True
