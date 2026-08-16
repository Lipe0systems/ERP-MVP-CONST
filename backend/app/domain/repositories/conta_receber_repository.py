"""
Interface (porta) do repositório de Contas a Receber.
Camada: Domain.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.financeiro import ContaReceber, StatusConta


class ContaReceberRepository(ABC):
    @abstractmethod
    def list_with_relacionamentos(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: StatusConta | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        """
        Retorna (itens da página já com 'cliente_nome' e 'obra_nome' anexados
        via LEFT JOIN — ambos opcionais — total de registros da empresa). Os
        nomes vêm junto para que o formulário de edição sempre consiga
        pré-selecionar cliente/obra vinculados, mesmo fora da primeira
        página de opções carregada nos <select>.
        """

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, conta_id: UUID) -> ContaReceber | None:
        ...

    @abstractmethod
    def create(self, conta: ContaReceber) -> ContaReceber:
        ...

    @abstractmethod
    def update(self, conta: ContaReceber) -> ContaReceber:
        ...

    @abstractmethod
    def delete(self, empresa_id: UUID, conta_id: UUID) -> bool:
        ...

    @abstractmethod
    def total_pendente(self, empresa_id: UUID) -> float:
        """Soma de TODAS as contas pendentes (vencidas ou não) — usado no Dashboard/Resumo."""

    @abstractmethod
    def fluxo_mensal(self, empresa_id: UUID, meses: list[str]) -> dict[str, float]:
        """Soma de valores LIQUIDADOS por mês ('YYYY-MM') — usado no fluxo de caixa."""

    @abstractmethod
    def fluxo_diario(self, empresa_id: UUID, dias: list[str]) -> dict[str, float]:
        """Soma de valores LIQUIDADOS por dia ('YYYY-MM-DD') — filtros de período curtos (7D-90D)."""
