"""
Endpoint de busca global (Cmd+K).
Pesquisa em paralelo por Clientes, Obras, Orçamentos e Vendas.
Camada: Presentation.
"""
from __future__ import annotations
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.models.orcamento import OrcamentoModel
from app.infrastructure.database.models.venda import VendaModel
from app.infrastructure.database.models.fornecedor import FornecedorModel

router = APIRouter(prefix="/busca", tags=["Busca Global"])


@router.get("")
def busca_global(
    q: str = Query(min_length=2, max_length=100),
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    limit: int = Query(5, ge=1, le=10),
):
    """
    Busca em múltiplos módulos e retorna resultados agrupados por tipo.
    Mínimo 2 caracteres para evitar buscas muito amplas.
    """
    termo = f"%{q.strip()}%"
    resultados = []

    # Clientes
    clientes = (
        db.query(ClienteModel)
        .filter(
            ClienteModel.empresa_id == empresa_id,
            ClienteModel.nome.ilike(termo) | ClienteModel.documento.ilike(termo),
        )
        .limit(limit)
        .all()
    )
    for c in clientes:
        resultados.append({
            "tipo": "cliente",
            "id": str(c.id),
            "titulo": c.nome,
            "subtitulo": c.documento,
            "link": f"/clientes/{c.id}",
        })

    # Obras
    obras = (
        db.query(ObraModel)
        .filter(
            ObraModel.empresa_id == empresa_id,
            ObraModel.nome.ilike(termo),
        )
        .limit(limit)
        .all()
    )
    for o in obras:
        resultados.append({
            "tipo": "obra",
            "id": str(o.id),
            "titulo": o.nome,
            "subtitulo": o.status,
            "link": "/obras",
        })

    # Orçamentos (por número)
    try:
        num = int(q.strip())
        orcamentos = (
            db.query(OrcamentoModel)
            .filter(OrcamentoModel.empresa_id == empresa_id, OrcamentoModel.numero == num)
            .limit(limit)
            .all()
        )
        for orc in orcamentos:
            resultados.append({
                "tipo": "orcamento",
                "id": str(orc.id),
                "titulo": f"Orçamento #{orc.numero:04d}",
                "subtitulo": orc.status,
                "link": "/orcamentos",
            })
    except ValueError:
        pass

    # Fornecedores
    fornecedores = (
        db.query(FornecedorModel)
        .filter(
            FornecedorModel.empresa_id == empresa_id,
            FornecedorModel.nome.ilike(termo),
        )
        .limit(limit)
        .all()
    )
    for f in fornecedores:
        resultados.append({
            "tipo": "fornecedor",
            "id": str(f.id),
            "titulo": f.nome,
            "subtitulo": f.documento or f.telefone or "",
            "link": "/fornecedores",
        })

    return {"query": q, "total": len(resultados), "resultados": resultados}
