"""
Endpoints do módulo RH (V4).

  Funcionários:  CRUD completo
  Alocações:     vincular funcionário a obra
  Ponto:         registro diário (individual e em lote), consulta por período
  Custo m.o.:    custo de mão de obra estimado por obra

Multi-tenant: toda query filtra empresa_id.
Camada: Presentation.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.funcionario import FuncionarioModel
from app.infrastructure.database.models.alocacao_obra import AlocacaoObraModel
from app.infrastructure.database.models.registro_ponto import RegistroPontoModel
from app.infrastructure.database.models.obra import ObraModel
from app.presentation.schemas.rh import (
    FuncionarioCreate, FuncionarioUpdate, FuncionarioOut,
    AlocacaoCreate, AlocacaoOut,
    PontoCreate, PontoLoteCreate, PontoOut,
    TIPOS_CONTRATACAO, STATUS_PONTO,
)

router = APIRouter(prefix="/rh", tags=["RH"])


# ═══ FUNCIONÁRIOS ═══════════════════════════════════════════════════════════

@router.get("/funcionarios", response_model=dict)
def listar_funcionarios(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    search: str | None = None,
    apenas_ativos: bool = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    q = db.query(FuncionarioModel).filter(FuncionarioModel.empresa_id == empresa_id)
    if apenas_ativos:
        q = q.filter(FuncionarioModel.ativo == True)
    if search:
        termo = f"%{search}%"
        q = q.filter(FuncionarioModel.nome.ilike(termo) | FuncionarioModel.cargo.ilike(termo))
    total = q.count()
    rows = q.order_by(FuncionarioModel.nome).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [FuncionarioOut.model_validate(r).model_dump() for r in rows],
        "total": total, "page": page, "page_size": page_size,
    }


@router.get("/funcionarios/{fid}", response_model=FuncionarioOut)
def obter_funcionario(fid: UUID, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    m = db.query(FuncionarioModel).filter(
        FuncionarioModel.empresa_id == empresa_id, FuncionarioModel.id == fid
    ).first()
    if not m:
        raise HTTPException(404, "Funcionário não encontrado.")
    return m


@router.post("/funcionarios", response_model=FuncionarioOut, status_code=201)
def criar_funcionario(body: FuncionarioCreate, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    if body.tipo_contratacao not in TIPOS_CONTRATACAO:
        raise HTTPException(422, f"Tipo de contratação inválido. Use: {', '.join(TIPOS_CONTRATACAO)}.")
    m = FuncionarioModel(id=uuid.uuid4(), empresa_id=empresa_id, **body.model_dump())
    db.add(m); db.commit(); db.refresh(m)
    return m


@router.put("/funcionarios/{fid}", response_model=FuncionarioOut)
def atualizar_funcionario(fid: UUID, body: FuncionarioUpdate, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    m = db.query(FuncionarioModel).filter(
        FuncionarioModel.empresa_id == empresa_id, FuncionarioModel.id == fid
    ).first()
    if not m:
        raise HTTPException(404, "Funcionário não encontrado.")
    for k, v in body.model_dump().items():
        setattr(m, k, v)
    db.commit(); db.refresh(m)
    return m


@router.delete("/funcionarios/{fid}", status_code=204)
def remover_funcionario(fid: UUID, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    m = db.query(FuncionarioModel).filter(
        FuncionarioModel.empresa_id == empresa_id, FuncionarioModel.id == fid
    ).first()
    if not m:
        raise HTTPException(404, "Funcionário não encontrado.")
    # Soft: marca inativo em vez de apagar (preserva histórico de ponto/alocação)
    m.ativo = False
    m.data_demissao = m.data_demissao or date.today()
    db.commit()


# ═══ ALOCAÇÕES (funcionário ↔ obra) ═════════════════════════════════════════

@router.get("/alocacoes", response_model=list[AlocacaoOut])
def listar_alocacoes(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    obra_id: UUID | None = None,
    funcionario_id: UUID | None = None,
    apenas_ativas: bool = False,
):
    q = (
        db.query(AlocacaoObraModel, FuncionarioModel.nome, ObraModel.nome)
        .join(FuncionarioModel, FuncionarioModel.id == AlocacaoObraModel.funcionario_id)
        .join(ObraModel, ObraModel.id == AlocacaoObraModel.obra_id)
        .filter(AlocacaoObraModel.empresa_id == empresa_id)
    )
    if obra_id:
        q = q.filter(AlocacaoObraModel.obra_id == obra_id)
    if funcionario_id:
        q = q.filter(AlocacaoObraModel.funcionario_id == funcionario_id)
    if apenas_ativas:
        q = q.filter(AlocacaoObraModel.ativa == True)

    out = []
    for aloc, fnome, onome in q.order_by(AlocacaoObraModel.data_inicio.desc()).all():
        d = AlocacaoOut.model_validate(aloc).model_dump()
        d["funcionario_nome"] = fnome
        d["obra_nome"] = onome
        out.append(d)
    return out


@router.post("/alocacoes", response_model=AlocacaoOut, status_code=201)
def criar_alocacao(body: AlocacaoCreate, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    # valida que funcionário e obra pertencem à empresa
    func_ok = db.query(FuncionarioModel).filter(
        FuncionarioModel.empresa_id == empresa_id, FuncionarioModel.id == body.funcionario_id
    ).first()
    obra_ok = db.query(ObraModel).filter(
        ObraModel.empresa_id == empresa_id, ObraModel.id == body.obra_id
    ).first()
    if not func_ok or not obra_ok:
        raise HTTPException(404, "Funcionário ou obra não encontrados.")

    m = AlocacaoObraModel(id=uuid.uuid4(), empresa_id=empresa_id, **body.model_dump())
    db.add(m); db.commit(); db.refresh(m)
    d = AlocacaoOut.model_validate(m).model_dump()
    d["funcionario_nome"] = func_ok.nome
    d["obra_nome"] = obra_ok.nome
    return d


@router.delete("/alocacoes/{aid}", status_code=204)
def remover_alocacao(aid: UUID, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    m = db.query(AlocacaoObraModel).filter(
        AlocacaoObraModel.empresa_id == empresa_id, AlocacaoObraModel.id == aid
    ).first()
    if not m:
        raise HTTPException(404, "Alocação não encontrada.")
    db.delete(m); db.commit()


# ═══ PONTO ══════════════════════════════════════════════════════════════════

@router.get("/ponto", response_model=list[PontoOut])
def listar_ponto(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    funcionario_id: UUID | None = None,
    obra_id: UUID | None = None,
):
    q = (
        db.query(RegistroPontoModel, FuncionarioModel.nome)
        .join(FuncionarioModel, FuncionarioModel.id == RegistroPontoModel.funcionario_id)
        .filter(
            RegistroPontoModel.empresa_id == empresa_id,
            RegistroPontoModel.data >= data_inicio,
            RegistroPontoModel.data <= data_fim,
        )
    )
    if funcionario_id:
        q = q.filter(RegistroPontoModel.funcionario_id == funcionario_id)
    if obra_id:
        q = q.filter(RegistroPontoModel.obra_id == obra_id)

    out = []
    for reg, fnome in q.order_by(RegistroPontoModel.data.desc()).all():
        d = PontoOut.model_validate(reg).model_dump()
        d["funcionario_nome"] = fnome
        out.append(d)
    return out


@router.post("/ponto", response_model=PontoOut, status_code=201)
def registrar_ponto(body: PontoCreate, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    if body.status not in STATUS_PONTO:
        raise HTTPException(422, f"Status inválido. Use: {', '.join(STATUS_PONTO)}.")
    # Upsert: 1 registro por funcionário por dia
    existente = db.query(RegistroPontoModel).filter(
        RegistroPontoModel.empresa_id == empresa_id,
        RegistroPontoModel.funcionario_id == body.funcionario_id,
        RegistroPontoModel.data == body.data,
    ).first()
    if existente:
        for k, v in body.model_dump().items():
            setattr(existente, k, v)
        db.commit(); db.refresh(existente)
        return existente
    m = RegistroPontoModel(id=uuid.uuid4(), empresa_id=empresa_id, **body.model_dump())
    db.add(m); db.commit(); db.refresh(m)
    return m


@router.post("/ponto/lote", response_model=dict, status_code=201)
def registrar_ponto_lote(body: PontoLoteCreate, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    """Marca o ponto de vários funcionários de uma vez (mesmo dia)."""
    criados = 0
    for reg in body.registros:
        if reg.status not in STATUS_PONTO:
            continue
        existente = db.query(RegistroPontoModel).filter(
            RegistroPontoModel.empresa_id == empresa_id,
            RegistroPontoModel.funcionario_id == reg.funcionario_id,
            RegistroPontoModel.data == body.data,
        ).first()
        payload = reg.model_dump()
        payload["data"] = body.data
        if body.obra_id and not payload.get("obra_id"):
            payload["obra_id"] = body.obra_id
        if existente:
            for k, v in payload.items():
                setattr(existente, k, v)
        else:
            db.add(RegistroPontoModel(id=uuid.uuid4(), empresa_id=empresa_id, **payload))
        criados += 1
    db.commit()
    return {"registros_salvos": criados, "data": str(body.data)}


# ═══ CUSTO DE MÃO DE OBRA POR OBRA ══════════════════════════════════════════

@router.get("/custo-mao-obra")
def custo_mao_obra(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    obra_id: UUID | None = None,
):
    """
    Estima o custo de mão de obra por obra, com base nos funcionários
    alocados e seus salários. Retorna uma lista: uma linha por obra.

    Cálculo: soma dos salários dos funcionários com alocação ativa na obra.
    (Estimativa mensal — folha de ponto detalhada pode refinar isso depois.)
    """
    q = (
        db.query(
            ObraModel.id,
            ObraModel.nome,
            func.count(func.distinct(AlocacaoObraModel.funcionario_id)).label("qtd"),
            func.coalesce(func.sum(FuncionarioModel.salario), 0).label("custo"),
        )
        .join(AlocacaoObraModel, AlocacaoObraModel.obra_id == ObraModel.id)
        .join(FuncionarioModel, FuncionarioModel.id == AlocacaoObraModel.funcionario_id)
        .filter(
            ObraModel.empresa_id == empresa_id,
            AlocacaoObraModel.ativa == True,
            FuncionarioModel.ativo == True,
        )
    )
    if obra_id:
        q = q.filter(ObraModel.id == obra_id)
    q = q.group_by(ObraModel.id, ObraModel.nome).order_by(ObraModel.nome)

    return [
        {
            "obra_id": str(oid),
            "obra_nome": onome,
            "funcionarios": int(qtd),
            "custo_mensal_estimado": float(custo),
        }
        for oid, onome, qtd, custo in q.all()
    ]
