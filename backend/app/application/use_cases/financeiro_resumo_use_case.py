"""
Caso de uso do resumo financeiro: combina Contas a Pagar e Contas a Receber
para alimentar tanto a tela de Financeiro quanto o Dashboard.
Camada: Application.
"""
from datetime import date
from uuid import UUID

from dateutil.relativedelta import relativedelta

from app.domain.repositories.conta_pagar_repository import ContaPagarRepository
from app.domain.repositories.conta_receber_repository import ContaReceberRepository


class FinanceiroResumoUseCase:
    def __init__(self, pagar_repository: ContaPagarRepository, receber_repository: ContaReceberRepository):
        self.pagar_repository = pagar_repository
        self.receber_repository = receber_repository

    def obter_resumo(self, empresa_id: UUID, meses_fluxo: int = 6) -> dict:
        total_a_pagar = self.pagar_repository.total_pendente(empresa_id)
        total_a_receber = self.receber_repository.total_pendente(empresa_id)

        hoje = date.today()
        # Últimos `meses_fluxo` meses, incluindo o mês atual, do mais antigo ao mais recente.
        referencias = [hoje - relativedelta(months=i) for i in range(meses_fluxo - 1, -1, -1)]
        chaves_mes = [ref.strftime("%Y-%m") for ref in referencias]

        saidas_por_mes = self.pagar_repository.fluxo_mensal(empresa_id, chaves_mes)
        entradas_por_mes = self.receber_repository.fluxo_mensal(empresa_id, chaves_mes)

        meses_pt = [
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez",
        ]
        fluxo_de_caixa = [
            {
                "mes": meses_pt[ref.month - 1],
                "entrada": entradas_por_mes.get(chave, 0.0),
                "saida": saidas_por_mes.get(chave, 0.0),
            }
            for ref, chave in zip(referencias, chaves_mes)
        ]

        return {
            "total_a_pagar": total_a_pagar,
            "total_a_receber": total_a_receber,
            "saldo_previsto": total_a_receber - total_a_pagar,
            "fluxo_de_caixa": fluxo_de_caixa,
        }
