"""
Endpoint de resumo do dashboard inicial.
Camada: Presentation.
"""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.application.use_cases.financeiro_resumo_use_case import FinanceiroResumoUseCase
from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
from app.infrastructure.repositories.conta_pagar_repository import SqlAlchemyContaPagarRepository
from app.infrastructure.repositories.conta_receber_repository import SqlAlchemyContaReceberRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumo")
def get_resumo(empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    """
    Retorna os indicadores principais do dashboard para a empresa autenticada.
    A partir da Fase 4, todos os indicadores refletem dados reais — nenhum
    mais é mockado.
    """
    obras_ativas, obras_concluidas = SqlAlchemyObraRepository(db).contar_ativas_e_concluidas(empresa_id)
    total_clientes = SqlAlchemyClienteRepository(db).contar(empresa_id)

    resumo_financeiro = FinanceiroResumoUseCase(
        pagar_repository=SqlAlchemyContaPagarRepository(db),
        receber_repository=SqlAlchemyContaReceberRepository(db),
    ).obter_resumo(empresa_id)

    return {
        "obras_ativas": obras_ativas,
        "obras_concluidas": obras_concluidas,
        "clientes": total_clientes,
        "contas_a_pagar": resumo_financeiro["total_a_pagar"],
        "contas_a_receber": resumo_financeiro["total_a_receber"],
        "fluxo_de_caixa": resumo_financeiro["fluxo_de_caixa"],
    }
