"""
Endpoint de resumo do dashboard — V3 expandido.
Camada: Presentation.
"""
from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.application.use_cases.financeiro_resumo_use_case import FinanceiroResumoUseCase
from app.core.security import get_empresa_id
from app.infrastructure.database.models.banco import ContaBancariaModel, LancamentoBancarioModel
from app.infrastructure.database.models.estoque import ItemEstoqueModel
from app.infrastructure.database.models.conta_pagar import ContaPagarModel
from app.infrastructure.database.models.conta_receber import ContaReceberModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.models.orcamento import OrcamentoModel
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
from app.infrastructure.repositories.conta_pagar_repository import SqlAlchemyContaPagarRepository
from app.infrastructure.repositories.conta_receber_repository import SqlAlchemyContaReceberRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository
from app.domain.entities.banco import TipoLancamento

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _saldo_total_banco(db: Session, empresa_id: UUID) -> float:
    """Saldo total = saldo_inicial de todas as contas ativas + entradas - saídas."""
    contas = db.query(ContaBancariaModel).filter(
        ContaBancariaModel.empresa_id == empresa_id,
        ContaBancariaModel.ativo == True,
    ).all()

    if not contas:
        return 0.0

    conta_ids = [c.id for c in contas]
    saldo_inicial = sum(float(c.saldo_inicial or 0) for c in contas)

    entradas = db.query(func.sum(LancamentoBancarioModel.valor)).filter(
        LancamentoBancarioModel.empresa_id == empresa_id,
        LancamentoBancarioModel.conta_id.in_(conta_ids),
        LancamentoBancarioModel.tipo == TipoLancamento.ENTRADA.value,
    ).scalar() or 0

    saidas = db.query(func.sum(LancamentoBancarioModel.valor)).filter(
        LancamentoBancarioModel.empresa_id == empresa_id,
        LancamentoBancarioModel.conta_id.in_(conta_ids),
        LancamentoBancarioModel.tipo == TipoLancamento.SAIDA.value,
    ).scalar() or 0

    return round(saldo_inicial + float(entradas) - float(saidas), 2)


def _obras_por_status(db: Session, empresa_id: UUID) -> list[dict]:
    """Conta obras agrupadas por status."""
    rows = (
        db.query(ObraModel.status, func.count(ObraModel.id))
        .filter(ObraModel.empresa_id == empresa_id)
        .group_by(ObraModel.status)
        .all()
    )
    labels = {
        "planejamento": "Planejamento",
        "em_andamento": "Em andamento",
        "pausada": "Pausada",
        "concluida": "Concluída",
        "cancelada": "Cancelada",
    }
    return [{"status": r[0], "label": labels.get(r[0], r[0]), "total": r[1]} for r in rows]


def _contas_vencendo(db: Session, empresa_id: UUID, dias: int = 7) -> dict:
    """Contas a pagar e receber vencendo nos próximos N dias."""
    hoje = date.today()
    limite = hoje + timedelta(days=dias)

    pagar = (
        db.query(ContaPagarModel)
        .filter(
            ContaPagarModel.empresa_id == empresa_id,
            ContaPagarModel.status == "pendente",
            ContaPagarModel.data_vencimento >= hoje,
            ContaPagarModel.data_vencimento <= limite,
        )
        .order_by(ContaPagarModel.data_vencimento)
        .limit(5)
        .all()
    )

    receber = (
        db.query(ContaReceberModel)
        .filter(
            ContaReceberModel.empresa_id == empresa_id,
            ContaReceberModel.status == "pendente",
            ContaReceberModel.data_vencimento >= hoje,
            ContaReceberModel.data_vencimento <= limite,
        )
        .order_by(ContaReceberModel.data_vencimento)
        .limit(5)
        .all()
    )

    return {
        "pagar": [{"id": str(c.id), "descricao": c.descricao, "valor": float(c.valor), "vencimento": str(c.data_vencimento)} for c in pagar],
        "receber": [{"id": str(c.id), "descricao": c.descricao, "valor": float(c.valor), "vencimento": str(c.data_vencimento)} for c in receber],
    }


def _indicadores_orcamentos(db: Session, empresa_id: UUID) -> dict:
    """Totais de orçamentos por status."""
    rows = (
        db.query(OrcamentoModel.status, func.count(OrcamentoModel.id))
        .filter(OrcamentoModel.empresa_id == empresa_id)
        .group_by(OrcamentoModel.status)
        .all()
    )
    por_status = {r[0]: r[1] for r in rows}
    return {
        "rascunho": por_status.get("rascunho", 0),
        "aprovado": por_status.get("aprovado", 0),
        "recusado": por_status.get("recusado", 0),
        "cancelado": por_status.get("cancelado", 0),
    }


@router.get("/resumo")
def get_resumo(empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    obras_ativas, obras_concluidas = SqlAlchemyObraRepository(db).contar_ativas_e_concluidas(empresa_id)
    total_clientes = SqlAlchemyClienteRepository(db).contar(empresa_id)

    resumo_financeiro = FinanceiroResumoUseCase(
        pagar_repository=SqlAlchemyContaPagarRepository(db),
        receber_repository=SqlAlchemyContaReceberRepository(db),
    ).obter_resumo(empresa_id)

    return {
        # Indicadores originais (V1)
        "obras_ativas": obras_ativas,
        "obras_concluidas": obras_concluidas,
        "clientes": total_clientes,
        "contas_a_pagar": resumo_financeiro["total_a_pagar"],
        "contas_a_receber": resumo_financeiro["total_a_receber"],
        "fluxo_de_caixa": resumo_financeiro["fluxo_de_caixa"],
        # Novos indicadores V3
        "saldo_bancario": _saldo_total_banco(db, empresa_id),
        "obras_por_status": _obras_por_status(db, empresa_id),
        "contas_vencendo_7_dias": _contas_vencendo(db, empresa_id, dias=7),
        "orcamentos": _indicadores_orcamentos(db, empresa_id),
        "estoque_abaixo_minimo": db.query(func.count(ItemEstoqueModel.id)).filter(
            ItemEstoqueModel.empresa_id == empresa_id,
            ItemEstoqueModel.estoque_minimo.isnot(None),
            ItemEstoqueModel.quantidade < ItemEstoqueModel.estoque_minimo,
        ).scalar() or 0,
    }

@router.get("/saude-obras")
def saude_das_obras(empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    """
    Classifica cada obra em andamento por saúde financeira, com base no
    percentual do orçamento previsto já consumido (mesmo critério do
    endpoint /obras/{id}/resultado — ver lá para o detalhamento completo).

    dentro_orcamento < 80% consumido | atencao 80-100% | acima_orcamento > 100%
    """
    from app.infrastructure.database.models.obra import ObraModel
    from app.infrastructure.database.models.orcamento_base_obra import OrcamentoBaseObraModel
    from app.infrastructure.database.models.movimentacao_estoque import MovimentacaoEstoqueModel
    from app.infrastructure.database.models.estoque import ItemEstoqueModel
    from app.infrastructure.database.models.conta_pagar import ContaPagarModel
    from app.infrastructure.database.models.alocacao_obra import AlocacaoObraModel
    from app.infrastructure.database.models.funcionario import FuncionarioModel

    obras = db.query(ObraModel).filter(
        ObraModel.empresa_id == empresa_id, ObraModel.status == "em_andamento",
    ).all()

    resultado = []
    for obra in obras:
        base = db.query(OrcamentoBaseObraModel).filter(
            OrcamentoBaseObraModel.empresa_id == empresa_id, OrcamentoBaseObraModel.obra_id == obra.id
        ).first()
        custo_previsto = float(base.valor_previsto) if base else float(obra.valor_previsto or 0)

        custo_material = db.query(
            func.coalesce(func.sum(MovimentacaoEstoqueModel.quantidade * ItemEstoqueModel.valor_medio), 0)
        ).join(ItemEstoqueModel, ItemEstoqueModel.id == MovimentacaoEstoqueModel.estoque_id).filter(
            MovimentacaoEstoqueModel.empresa_id == empresa_id,
            MovimentacaoEstoqueModel.obra_id == obra.id,
            MovimentacaoEstoqueModel.tipo.in_(["entrada", "transferencia", "consumo"]),
        ).scalar() or 0

        custo_pagar = db.query(func.coalesce(func.sum(ContaPagarModel.valor), 0)).filter(
            ContaPagarModel.empresa_id == empresa_id, ContaPagarModel.obra_id == obra.id,
        ).scalar() or 0

        custo_mo = db.query(func.coalesce(func.sum(FuncionarioModel.salario), 0)).join(
            AlocacaoObraModel, AlocacaoObraModel.funcionario_id == FuncionarioModel.id
        ).filter(
            AlocacaoObraModel.empresa_id == empresa_id, AlocacaoObraModel.obra_id == obra.id,
            AlocacaoObraModel.ativa == True, FuncionarioModel.ativo == True,
        ).scalar() or 0

        custo_realizado = float(custo_material) + float(custo_pagar) + float(custo_mo)
        pct = (custo_realizado / custo_previsto * 100) if custo_previsto else 0

        if pct < 80:
            saude = "dentro_orcamento"
        elif pct < 100:
            saude = "atencao"
        else:
            saude = "acima_orcamento"

        resultado.append({
            "obra_id": str(obra.id), "obra_nome": obra.nome,
            "custo_previsto": round(custo_previsto, 2),
            "custo_realizado": round(custo_realizado, 2),
            "percentual_consumido": round(pct, 2),
            "saude": saude,
        })

    return sorted(resultado, key=lambda r: -r["percentual_consumido"])
