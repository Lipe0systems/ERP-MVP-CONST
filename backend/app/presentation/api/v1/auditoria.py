"""
Endpoint de consulta do log de auditoria.
Camada: Presentation.
"""
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.auditoria import RegistroAuditoriaModel

router = APIRouter(prefix="/auditoria", tags=["Auditoria"])


@router.get("")
def listar_auditoria(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    modulo: str | None = Query(None),
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    q = db.query(RegistroAuditoriaModel).filter(
        RegistroAuditoriaModel.empresa_id == empresa_id
    )
    if modulo:
        q = q.filter(RegistroAuditoriaModel.modulo == modulo)
    if data_inicio:
        q = q.filter(func.date(RegistroAuditoriaModel.criado_em) >= data_inicio)
    if data_fim:
        q = q.filter(func.date(RegistroAuditoriaModel.criado_em) <= data_fim)

    total = q.with_entities(func.count(RegistroAuditoriaModel.id)).scalar() or 0
    rows = (
        q.order_by(RegistroAuditoriaModel.criado_em.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        {
            "id": str(r.id),
            "usuario_email": r.usuario_email,
            "modulo": r.modulo,
            "acao": r.acao,
            "entidade_id": r.entidade_id,
            "descricao": r.descricao,
            "criado_em": r.criado_em.isoformat(),
        }
        for r in rows
    ]
    return {"items": items, "total": total, "page": page, "page_size": page_size}
