"""
Soft delete global (V4) — SQLAlchemy 2.0.

Estratégia em duas partes:

1. FILTRO AUTOMÁTICO (evento do_orm_execute + with_loader_criteria)
   Esta é a forma OFICIAL recomendada no SQLAlchemy 2.0 para soft delete.
   Toda query ORM ganha automaticamente "deletado_em IS NULL" para todas as
   entidades que têm essa coluna. As listagens existentes não mudam nada.

   Para ver os deletados (Lixeira/restauração/expurgo), a query recebe a
   execution_option include_deleted=True, que desliga o critério.

2. SOFT DELETE EXPLÍCITO (helper soft_delete)
   Os repositórios marcam deletado_em em vez de db.delete(obj).

Camada: Infrastructure.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import event
from sqlalchemy.orm import Session, with_loader_criteria


class _SoftDeleteMixinMarker:
    """Marcador — qualquer classe com atributo deletado_em é elegível ao filtro."""
    pass


@event.listens_for(Session, "do_orm_execute")
def _filtrar_soft_deleted(execute_state):
    # Só mexe em SELECTs de ORM que não pediram explicitamente os deletados
    if (
        execute_state.is_select
        and not execute_state.is_column_load
        and not execute_state.is_relationship_load
        and not execute_state.execution_options.get("include_deleted", False)
    ):
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                _HasDeletadoEm,
                lambda cls: cls.deletado_em.is_(None),
                include_aliases=True,
            )
        )


# Classe base "virtual" para o with_loader_criteria mirar qualquer model
# que tenha a coluna deletado_em. Como todos herdam de BaseModel (que tem a
# coluna), usamos BaseModel como alvo.
from app.infrastructure.database.models.base import BaseModel as _HasDeletadoEm  # noqa: E402


# ─── Helpers ─────────────────────────────────────────────────────────────────

def soft_delete(db: Session, obj) -> None:
    """Marca um objeto como deletado (lixeira) em vez de apagá-lo."""
    obj.deletado_em = datetime.utcnow()
    db.add(obj)
    db.commit()


def restaurar(db: Session, obj) -> None:
    """Tira um objeto da lixeira."""
    obj.deletado_em = None
    db.add(obj)
    db.commit()


def with_deleted(query):
    """
    Desliga o filtro de soft delete nesta query (Lixeira/restauração/expurgo).
    Funciona tanto no estilo Query legacy quanto no 2.0.
    """
    return query.execution_options(include_deleted=True)


def only_deleted(query, model):
    """Apenas os registros na lixeira (deletado_em preenchido)."""
    return with_deleted(query).filter(model.deletado_em.isnot(None))
