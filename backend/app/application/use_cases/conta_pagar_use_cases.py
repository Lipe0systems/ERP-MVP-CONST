"""
Casos de uso do módulo Contas a Pagar. Camada: Application.
"""
from __future__ import annotations
import uuid
from dataclasses import replace
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.financeiro import ContaPagar, StatusConta
from app.domain.repositories.conta_pagar_repository import ContaPagarRepository
from app.domain.repositories.obra_repository import ObraRepository


class ContaPagarUseCases:
    def __init__(self, repository: ContaPagarRepository, obra_repository: ObraRepository):
        self.repository = repository
        self.obra_repository = obra_repository

    def _validar_obra(self, empresa_id: UUID, obra_id: UUID | None) -> None:
        if obra_id and self.obra_repository.get_by_id(empresa_id, obra_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Obra informada não foi encontrada nesta empresa.",
            )

    @staticmethod
    def _validar_liquidacao(status_conta: StatusConta, data_pagamento: date | None) -> None:
        if status_conta == StatusConta.LIQUIDADO and data_pagamento is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Informe a data de pagamento para marcar a conta como paga.",
            )

    def listar(
        self, empresa_id: UUID, search: str | None, status_filtro: StatusConta | None, page: int, page_size: int
    ) -> tuple[list[dict], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.repository.list_with_obra_nome(empresa_id, search, status_filtro, page, page_size)

    def obter(self, empresa_id: UUID, conta_id: UUID) -> ContaPagar:
        conta = self.repository.get_by_id(empresa_id, conta_id)
        if conta is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta a pagar não encontrada.")
        return conta

    def criar(
        self,
        empresa_id: UUID,
        descricao: str,
        valor: float,
        data_vencimento: date,
        fornecedor: str | None,
        obra_id: UUID | None,
        categoria: str | None,
        data_pagamento: date | None,
        status_conta: StatusConta,
        observacoes: str | None,
    ) -> ContaPagar:
        self._validar_obra(empresa_id, obra_id)
        self._validar_liquidacao(status_conta, data_pagamento)

        conta = ContaPagar(
            id=uuid.uuid4(),
            empresa_id=empresa_id,
            descricao=descricao.strip(),
            valor=valor,
            data_vencimento=data_vencimento,
            fornecedor=fornecedor,
            obra_id=obra_id,
            categoria=categoria,
            data_pagamento=data_pagamento,
            status=status_conta,
            observacoes=observacoes,
        )
        return self.repository.create(conta)

    def atualizar(
        self,
        empresa_id: UUID,
        conta_id: UUID,
        descricao: str,
        valor: float,
        data_vencimento: date,
        fornecedor: str | None,
        obra_id: UUID | None,
        categoria: str | None,
        data_pagamento: date | None,
        status_conta: StatusConta,
        observacoes: str | None,
    ) -> ContaPagar:
        existente = self.obter(empresa_id, conta_id)
        self._validar_obra(empresa_id, obra_id)
        self._validar_liquidacao(status_conta, data_pagamento)

        atualizada = replace(
            existente,
            descricao=descricao.strip(),
            valor=valor,
            data_vencimento=data_vencimento,
            fornecedor=fornecedor,
            obra_id=obra_id,
            categoria=categoria,
            data_pagamento=data_pagamento,
            status=status_conta,
            observacoes=observacoes,
        )
        return self.repository.update(atualizada)

    def remover(self, empresa_id: UUID, conta_id: UUID) -> None:
        removida = self.repository.delete(empresa_id, conta_id)
        if not removida:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta a pagar não encontrada.")
