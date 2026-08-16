"""
Caso de uso do resumo financeiro: combina Contas a Pagar e Contas a Receber
para alimentar tanto a tela de Financeiro quanto o Dashboard.
Camada: Application.
"""
from datetime import date, timedelta
from uuid import UUID

from dateutil.relativedelta import relativedelta

from app.domain.repositories.conta_pagar_repository import ContaPagarRepository
from app.domain.repositories.conta_receber_repository import ContaReceberRepository

# Períodos aceitos pelo filtro do Fluxo de Caixa. Os "curtos" (dias) usam
# granularidade DIÁRIA; os "longos" usam granularidade MENSAL — não faz
# sentido mostrar 365 pontos diários num gráfico de 12 meses.
PERIODOS_EM_DIAS = {"7d": 7, "15d": 15, "30d": 30, "60d": 60, "90d": 90}
PERIODOS_EM_MESES = {"6m": 6, "12m": 12}

MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


class FinanceiroResumoUseCase:
    def __init__(self, pagar_repository: ContaPagarRepository, receber_repository: ContaReceberRepository):
        self.pagar_repository = pagar_repository
        self.receber_repository = receber_repository

    def obter_resumo(self, empresa_id: UUID, periodo: str = "6m") -> dict:
        total_a_pagar = self.pagar_repository.total_pendente(empresa_id)
        total_a_receber = self.receber_repository.total_pendente(empresa_id)

        if periodo in PERIODOS_EM_DIAS:
            fluxo_de_caixa = self._fluxo_diario(empresa_id, PERIODOS_EM_DIAS[periodo])
        else:
            # Período desconhecido cai no padrão de 6 meses — nunca quebra
            # por causa de um valor de query param inesperado.
            meses = PERIODOS_EM_MESES.get(periodo, 6)
            fluxo_de_caixa = self._fluxo_mensal(empresa_id, meses)

        return {
            "total_a_pagar": total_a_pagar,
            "total_a_receber": total_a_receber,
            "saldo_previsto": total_a_receber - total_a_pagar,
            "fluxo_de_caixa": fluxo_de_caixa,
        }

    def _fluxo_mensal(self, empresa_id: UUID, meses_fluxo: int) -> list[dict]:
        hoje = date.today()
        referencias = [hoje - relativedelta(months=i) for i in range(meses_fluxo - 1, -1, -1)]
        chaves = [ref.strftime("%Y-%m") for ref in referencias]

        saidas = self.pagar_repository.fluxo_mensal(empresa_id, chaves)
        entradas = self.receber_repository.fluxo_mensal(empresa_id, chaves)

        return [
            {
                "mes": MESES_PT[ref.month - 1],
                "entrada": entradas.get(chave, 0.0),
                "saida": saidas.get(chave, 0.0),
            }
            for ref, chave in zip(referencias, chaves)
        ]

    def _fluxo_diario(self, empresa_id: UUID, dias_periodo: int) -> list[dict]:
        hoje = date.today()
        referencias = [hoje - timedelta(days=i) for i in range(dias_periodo - 1, -1, -1)]
        chaves = [ref.strftime("%Y-%m-%d") for ref in referencias]

        saidas = self.pagar_repository.fluxo_diario(empresa_id, chaves)
        entradas = self.receber_repository.fluxo_diario(empresa_id, chaves)

        return [
            {
                # dd/mm — rótulo curto, cabe em gráficos com muitos pontos (60D, 90D)
                "mes": ref.strftime("%d/%m"),
                "entrada": entradas.get(chave, 0.0),
                "saida": saidas.get(chave, 0.0),
            }
            for ref, chave in zip(referencias, chaves)
        ]
