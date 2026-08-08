"""
Endpoint de calendário — agrega eventos de múltiplos módulos num único response.
Retorna: atendimentos agendados, vencimentos de contas e obras ativas.
Camada: Presentation.
"""
from __future__ import annotations
from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.atendimento import AtendimentoModel
from app.infrastructure.database.models.conta_pagar import ContaPagarModel
from app.infrastructure.database.models.conta_receber import ContaReceberModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.models.cliente import ClienteModel

router = APIRouter(prefix="/calendario", tags=["Calendário"])


@router.get("/eventos")
def listar_eventos(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    data_inicio: date = Query(default=None),
    data_fim: date = Query(default=None),
):
    hoje = date.today()
    inicio = data_inicio or hoje.replace(day=1)
    fim = data_fim or (inicio.replace(month=inicio.month % 12 + 1, day=1) - timedelta(days=1))

    eventos = []

    # 1. Atendimentos agendados no período
    atendimentos = (
        db.query(AtendimentoModel, ClienteModel.nome)
        .join(ClienteModel, ClienteModel.id == AtendimentoModel.cliente_id)
        .filter(
            AtendimentoModel.empresa_id == empresa_id,
            AtendimentoModel.status == "agendado",
            AtendimentoModel.data >= inicio,
            AtendimentoModel.data <= fim,
        )
        .all()
    )
    for a, cliente_nome in atendimentos:
        hora_str = a.hora.strftime("%H:%M") if a.hora else ""
        eventos.append({
            "id": f"atend-{a.id}",
            "tipo": "atendimento",
            "titulo": f"Atendimento — {cliente_nome}",
            "subtitulo": hora_str,
            "data": str(a.data),
            "cor": "#f59e0b",   # âmbar
            "link": "/atendimentos",
        })

    # 2. Contas a pagar vencendo no período
    contas_pagar = (
        db.query(ContaPagarModel)
        .filter(
            ContaPagarModel.empresa_id == empresa_id,
            ContaPagarModel.status == "pendente",
            ContaPagarModel.data_vencimento >= inicio,
            ContaPagarModel.data_vencimento <= fim,
        )
        .all()
    )
    for cp in contas_pagar:
        vencida = cp.data_vencimento < hoje
        eventos.append({
            "id": f"cp-{cp.id}",
            "tipo": "conta_pagar",
            "titulo": f"Pagar: {cp.descricao[:40]}",
            "subtitulo": f"R$ {float(cp.valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "data": str(cp.data_vencimento),
            "cor": "#ef4444" if vencida else "#f97316",   # vermelho se vencida, laranja se pendente
            "link": "/financeiro",
        })

    # 3. Contas a receber vencendo no período
    contas_receber = (
        db.query(ContaReceberModel)
        .filter(
            ContaReceberModel.empresa_id == empresa_id,
            ContaReceberModel.status == "pendente",
            ContaReceberModel.data_vencimento >= inicio,
            ContaReceberModel.data_vencimento <= fim,
        )
        .all()
    )
    for cr in contas_receber:
        vencida = cr.data_vencimento < hoje
        eventos.append({
            "id": f"cr-{cr.id}",
            "tipo": "conta_receber",
            "titulo": f"Receber: {cr.descricao[:40]}",
            "subtitulo": f"R$ {float(cr.valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "data": str(cr.data_vencimento),
            "cor": "#ef4444" if vencida else "#22c55e",   # vermelho se vencida, verde se pendente
            "link": "/financeiro",
        })

    # 4. Obras em andamento no período (usa data de início/prazo)
    obras = (
        db.query(ObraModel)
        .filter(
            ObraModel.empresa_id == empresa_id,
            ObraModel.status == "em_andamento",
            ObraModel.data_inicio != None,
        )
        .limit(20)
        .all()
    )
    for o in obras:
        if o.data_inicio and inicio <= o.data_inicio <= fim:
            eventos.append({
                "id": f"obra-inicio-{o.id}",
                "tipo": "obra",
                "titulo": f"Obra: {o.nome}",
                "subtitulo": "Início",
                "data": str(o.data_inicio),
                "cor": "#6366f1",   # índigo
                "link": "/obras",
            })
        if o.prazo_conclusao and inicio <= o.prazo_conclusao <= fim:
            eventos.append({
                "id": f"obra-prazo-{o.id}",
                "tipo": "obra",
                "titulo": f"Prazo: {o.nome}",
                "subtitulo": "Conclusão prevista",
                "data": str(o.prazo_conclusao),
                "cor": "#8b5cf6",   # violeta
                "link": "/obras",
            })

    # Ordenar por data
    eventos.sort(key=lambda e: e["data"])

    return {
        "inicio": str(inicio),
        "fim": str(fim),
        "total": len(eventos),
        "eventos": eventos,
    }
