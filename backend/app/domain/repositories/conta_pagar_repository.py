"""
Interface (porta) do repositório de Contas a Pagar.
Camada: Domain.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.financeiro import ContaPagar, StatusConta


class ContaPagarRepository(ABC):
    @abstractmethod
    def list_with_obra_nome(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: StatusConta | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        """
        Retorna (itens da página já com 'obra_nome' anexado via LEFT JOIN —
        obra é opcional aqui — total de registros da empresa). O nome vem
        junto para que o formulário de edição sempre consiga pré-selecionar
        a obra vinculada no dropdown, mesmo que ela esteja fora da primeira
        página de opções carregadas no <select>.
        """

    @abstractmethod
    def get_by_id(self, empresa_id: UUID, conta_id: UUID) -> ContaPagar | None:
        ...

    @abstractmethod
    def create(self, conta: ContaPagar) -> ContaPagar:
        ...

    @abstractmethod
    def update(self, conta: ContaPagar) -> ContaPagar:
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
