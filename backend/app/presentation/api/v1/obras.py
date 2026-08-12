"""
Endpoints REST do módulo Obras.
Camada: Presentation — converte HTTP <-> casos de uso, sem regra de negócio aqui.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.application.use_cases.obra_use_cases import ObraUseCases
from app.core.security import get_empresa_id
from app.domain.entities.obra import ObraStatus
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository
from app.presentation.schemas.obra import ObraCreate, ObraListOut, ObraOut, ObraUpdate
from sqlalchemy import func

router = APIRouter(prefix="/obras", tags=["Obras"])


def _get_use_cases(db: Session = Depends(get_db)) -> ObraUseCases:
    return ObraUseCases(
        obra_repository=SqlAlchemyObraRepository(db),
        cliente_repository=SqlAlchemyClienteRepository(db),
    )


@router.get("", response_model=ObraListOut)
def listar_obras(
    search: str | None = Query(None, description="Busca por nome da obra ou do cliente"),
    status_filtro: ObraStatus | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    itens, total = use_cases.listar(empresa_id, search, status_filtro, page, page_size)
    return ObraListOut(items=itens, total=total, page=page, page_size=page_size)


@router.get("/{obra_id}", response_model=ObraOut)
def obter_obra(
    obra_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    return use_cases.obter(empresa_id, obra_id)


@router.post("", response_model=ObraOut, status_code=status.HTTP_201_CREATED)
def criar_obra(
    payload: ObraCreate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    return use_cases.criar(
        empresa_id=empresa_id,
        nome=payload.nome,
        cliente_id=payload.cliente_id,
        endereco=payload.endereco,
        responsavel=payload.responsavel,
        data_inicio=payload.data_inicio,
        data_previsao=payload.data_previsao,
        status_obra=payload.status,
        valor_previsto=payload.valor_previsto,
        valor_realizado=payload.valor_realizado,
    )


@router.put("/{obra_id}", response_model=ObraOut)
def atualizar_obra(
    obra_id: UUID,
    payload: ObraUpdate,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    return use_cases.atualizar(
        empresa_id=empresa_id,
        obra_id=obra_id,
        nome=payload.nome,
        cliente_id=payload.cliente_id,
        endereco=payload.endereco,
        responsavel=payload.responsavel,
        data_inicio=payload.data_inicio,
        data_previsao=payload.data_previsao,
        status_obra=payload.status,
        valor_previsto=payload.valor_previsto,
        valor_realizado=payload.valor_realizado,
    )


@router.delete("/{obra_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_obra(
    obra_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: ObraUseCases = Depends(_get_use_cases),
):
    use_cases.remover(empresa_id, obra_id)

# ═══ V4 — Resultado da Obra (Fluxo 6) ═══════════════════════════════════════

@router.get("/{obra_id}/resultado")
def resultado_da_obra(
    obra_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    """
    Visão financeira/gerencial consolidada da obra: receita, custos
    (material, mão de obra, outros), previsto x realizado e margem.
    Todos os valores vêm de dados reais do banco — nada estimado.
    """
    from fastapi import HTTPException
    from app.infrastructure.database.models.obra import ObraModel
    from app.infrastructure.database.models.orcamento_base_obra import OrcamentoBaseObraModel
    from app.infrastructure.database.models.venda import VendaModel
    from app.infrastructure.database.models.conta_receber import ContaReceberModel
    from app.infrastructure.database.models.conta_pagar import ContaPagarModel
    from app.infrastructure.database.models.movimentacao_estoque import MovimentacaoEstoqueModel
    from app.infrastructure.database.models.estoque import ItemEstoqueModel
    from app.infrastructure.database.models.alocacao_obra import AlocacaoObraModel
    from app.infrastructure.database.models.registro_ponto import RegistroPontoModel
    from app.infrastructure.database.models.funcionario import FuncionarioModel

    obra = db.query(ObraModel).filter(
        ObraModel.empresa_id == empresa_id, ObraModel.id == obra_id
    ).first()
    if not obra:
        raise HTTPException(404, "Obra não encontrada.")

    # ── Previsto: orçamento-base da obra (snapshot), com fallback pro valor_previsto direto
    base = db.query(OrcamentoBaseObraModel).filter(
        OrcamentoBaseObraModel.empresa_id == empresa_id, OrcamentoBaseObraModel.obra_id == obra_id
    ).first()
    custo_previsto = float(base.valor_previsto) if base else float(obra.valor_previsto or 0)

    # ── Receita: vendas vinculadas à obra + valor contratado
    receita_vendas = db.query(func.coalesce(func.sum(VendaModel.valor_total), 0)).filter(
        VendaModel.empresa_id == empresa_id, VendaModel.obra_id == obra_id,
    ).scalar() or 0

    receita_recebida = db.query(func.coalesce(func.sum(ContaReceberModel.valor), 0)).filter(
        ContaReceberModel.empresa_id == empresa_id,
        ContaReceberModel.obra_id == obra_id,
        ContaReceberModel.status == "liquidado",
    ).scalar() or 0

    valor_contratado = float(obra.valor_previsto or receita_vendas or 0)

    # ── Custo de material: movimentações reais vinculadas à obra
    custo_material = db.query(
        func.coalesce(func.sum(MovimentacaoEstoqueModel.quantidade * ItemEstoqueModel.valor_medio), 0)
    ).join(
        ItemEstoqueModel, ItemEstoqueModel.id == MovimentacaoEstoqueModel.estoque_id
    ).filter(
        MovimentacaoEstoqueModel.empresa_id == empresa_id,
        MovimentacaoEstoqueModel.obra_id == obra_id,
        MovimentacaoEstoqueModel.tipo.in_(["entrada", "transferencia", "consumo"]),
    ).scalar() or 0

    # ── Custo de compras diretas vinculadas à obra (contas a pagar da obra)
    custo_contas_pagar = db.query(func.coalesce(func.sum(ContaPagarModel.valor), 0)).filter(
        ContaPagarModel.empresa_id == empresa_id, ContaPagarModel.obra_id == obra_id,
    ).scalar() or 0

    # ── Custo de mão de obra: alocação simples (soma de salários dos ativos na obra)
    custo_mao_obra = db.query(func.coalesce(func.sum(FuncionarioModel.salario), 0)).join(
        AlocacaoObraModel, AlocacaoObraModel.funcionario_id == FuncionarioModel.id
    ).filter(
        AlocacaoObraModel.empresa_id == empresa_id,
        AlocacaoObraModel.obra_id == obra_id,
        AlocacaoObraModel.ativa == True,
        FuncionarioModel.ativo == True,
    ).scalar() or 0

    custo_realizado = float(custo_material) + float(custo_contas_pagar) + float(custo_mao_obra)
    resultado_previsto = valor_contratado - custo_previsto
    resultado_atual = valor_contratado - custo_realizado

    margem_prevista = (resultado_previsto / valor_contratado * 100) if valor_contratado else 0
    margem_atual = (resultado_atual / valor_contratado * 100) if valor_contratado else 0

    percentual_consumido = (custo_realizado / custo_previsto * 100) if custo_previsto else 0

    # ── Saúde da obra: critério objetivo baseado no % do previsto já consumido
    if percentual_consumido < 80:
        saude = "dentro_orcamento"
    elif percentual_consumido < 100:
        saude = "atencao"
    else:
        saude = "acima_orcamento"

    return {
        "obra_id": str(obra.id),
        "obra_nome": obra.nome,
        "receita": {
            "valor_contratado": round(valor_contratado, 2),
            "vendas_relacionadas": round(float(receita_vendas), 2),
            "recebido": round(float(receita_recebida), 2),
        },
        "custos": {
            "material": round(float(custo_material), 2),
            "mao_de_obra": round(float(custo_mao_obra), 2),
            "outros_contas_a_pagar": round(float(custo_contas_pagar), 2),
            "total_realizado": round(custo_realizado, 2),
            "total_previsto": round(custo_previsto, 2),
        },
        "indicadores": {
            "resultado_previsto": round(resultado_previsto, 2),
            "resultado_atual": round(resultado_atual, 2),
            "margem_prevista_pct": round(margem_prevista, 2),
            "margem_atual_pct": round(margem_atual, 2),
            "percentual_consumido": round(percentual_consumido, 2),
        },
        "saude": saude,
    }
