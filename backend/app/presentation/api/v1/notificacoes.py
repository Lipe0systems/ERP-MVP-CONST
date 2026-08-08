"""
Endpoint de notificações internas.
Agrega alertas de múltiplos módulos em uma única chamada.
Camada: Presentation.
"""
from __future__ import annotations
from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.compra import CompraModel
from app.infrastructure.database.models.conta_pagar import ContaPagarModel
from app.infrastructure.database.models.conta_receber import ContaReceberModel
from app.infrastructure.database.models.orcamento import OrcamentoModel

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])


@router.get("")
def listar_notificacoes(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    """
    Retorna alertas agregados para exibição no header.
    Cada notificação tem: tipo, titulo, descricao, quantidade, urgente.
    """
    hoje = date.today()
    amanha = hoje + timedelta(days=1)
    proximos_7 = hoje + timedelta(days=7)

    notificacoes = []

    # 1. Contas a pagar VENCIDAS (urgente)
    vencidas_pagar = db.query(func.count(ContaPagarModel.id)).filter(
        ContaPagarModel.empresa_id == empresa_id,
        ContaPagarModel.status == "pendente",
        ContaPagarModel.data_vencimento < hoje,
    ).scalar() or 0

    if vencidas_pagar > 0:
        notificacoes.append({
            "tipo": "conta_pagar_vencida",
            "titulo": "Contas a pagar vencidas",
            "descricao": f"{vencidas_pagar} conta{'s' if vencidas_pagar > 1 else ''} vencida{'s' if vencidas_pagar > 1 else ''}",
            "quantidade": vencidas_pagar,
            "urgente": True,
            "link": "/financeiro",
        })

    # 2. Contas a pagar vencendo nos próximos 7 dias
    vencendo_pagar = db.query(func.count(ContaPagarModel.id)).filter(
        ContaPagarModel.empresa_id == empresa_id,
        ContaPagarModel.status == "pendente",
        ContaPagarModel.data_vencimento >= hoje,
        ContaPagarModel.data_vencimento <= proximos_7,
    ).scalar() or 0

    if vencendo_pagar > 0:
        notificacoes.append({
            "tipo": "conta_pagar_vencendo",
            "titulo": "Contas a pagar vencendo",
            "descricao": f"{vencendo_pagar} conta{'s' if vencendo_pagar > 1 else ''} vence{'m' if vencendo_pagar > 1 else ''} em até 7 dias",
            "quantidade": vencendo_pagar,
            "urgente": False,
            "link": "/financeiro",
        })

    # 3. Contas a receber VENCIDAS (urgente)
    vencidas_receber = db.query(func.count(ContaReceberModel.id)).filter(
        ContaReceberModel.empresa_id == empresa_id,
        ContaReceberModel.status == "pendente",
        ContaReceberModel.data_vencimento < hoje,
    ).scalar() or 0

    if vencidas_receber > 0:
        notificacoes.append({
            "tipo": "conta_receber_vencida",
            "titulo": "Contas a receber vencidas",
            "descricao": f"{vencidas_receber} recebimento{'s' if vencidas_receber > 1 else ''} em atraso",
            "quantidade": vencidas_receber,
            "urgente": True,
            "link": "/financeiro",
        })

    # 4. Orçamentos em rascunho há mais de 7 dias (parados)
    data_limite = hoje - timedelta(days=7)
    orcamentos_parados = db.query(func.count(OrcamentoModel.id)).filter(
        OrcamentoModel.empresa_id == empresa_id,
        OrcamentoModel.status == "rascunho",
        OrcamentoModel.criado_em <= data_limite,
    ).scalar() or 0

    if orcamentos_parados > 0:
        notificacoes.append({
            "tipo": "orcamento_parado",
            "titulo": "Orçamentos sem resposta",
            "descricao": f"{orcamentos_parados} orçamento{'s' if orcamentos_parados > 1 else ''} em rascunho há mais de 7 dias",
            "quantidade": orcamentos_parados,
            "urgente": False,
            "link": "/orcamentos",
        })

    # 5. Compras pendentes há mais de 3 dias
    data_limite_compra = hoje - timedelta(days=3)
    compras_pendentes = db.query(func.count(CompraModel.id)).filter(
        CompraModel.empresa_id == empresa_id,
        CompraModel.status == "pendente",
        CompraModel.criado_em <= data_limite_compra,
    ).scalar() or 0

    if compras_pendentes > 0:
        notificacoes.append({
            "tipo": "compra_pendente",
            "titulo": "Compras pendentes",
            "descricao": f"{compras_pendentes} compra{'s' if compras_pendentes > 1 else ''} pendente{'s' if compras_pendentes > 1 else ''} há mais de 3 dias",
            "quantidade": compras_pendentes,
            "urgente": False,
            "link": "/compras",
        })

    total = sum(n["quantidade"] for n in notificacoes)
    urgentes = sum(1 for n in notificacoes if n["urgente"])

    return {
        "notificacoes": notificacoes,
        "total": total,
        "urgentes": urgentes,
    }
