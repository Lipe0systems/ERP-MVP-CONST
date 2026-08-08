"""
Casos de uso do módulo Contas a Receber. Camada: Application.
"""
from __future__ import annotations
import uuid
from dataclasses import replace
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.financeiro import ContaReceber, StatusConta
from app.domain.repositories.cliente_repository import ClienteRepository
from app.domain.repositories.conta_receber_repository import ContaReceberRepository
from app.domain.repositories.obra_repository import ObraRepository


class ContaReceberUseCases:
    def __init__(
        self,
        repository: ContaReceberRepository,
        cliente_repository: ClienteRepository,
        obra_repository: ObraRepository,
    ):
        self.repository = repository
        self.cliente_repository = cliente_repository
        self.obra_repository = obra_repository

    def _validar_cliente(self, empresa_id: UUID, cliente_id: UUID | None) -> None:
        if cliente_id and self.cliente_repository.get_by_id(empresa_id, cliente_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente informado não foi encontrado nesta empresa.",
            )

    def _validar_obra(self, empresa_id: UUID, obra_id: UUID | None) -> None:
        if obra_id and self.obra_repository.get_by_id(empresa_id, obra_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Obra informada não foi encontrada nesta empresa.",
            )

    @staticmethod
    def _validar_liquidacao(status_conta: StatusConta, data_recebimento: date | None) -> None:
        if status_conta == StatusConta.LIQUIDADO and data_recebimento is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Informe a data de recebimento para marcar a conta como recebida.",
            )

    def listar(
        self, empresa_id: UUID, search: str | None, status_filtro: StatusConta | None, page: int, page_size: int
    ) -> tuple[list[dict], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.repository.list_with_relacionamentos(empresa_id, search, status_filtro, page, page_size)

    def obter(self, empresa_id: UUID, conta_id: UUID) -> ContaReceber:
        conta = self.repository.get_by_id(empresa_id, conta_id)
        if conta is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta a receber não encontrada.")
        return conta

    def criar(
        self,
        empresa_id: UUID,
        descricao: str,
        valor: float,
        data_vencimento: date,
        cliente_id: UUID | None,
        obra_id: UUID | None,
        data_recebimento: date | None,
        status_conta: StatusConta,
        observacoes: str | None,
    ) -> ContaReceber:
        self._validar_cliente(empresa_id, cliente_id)
        self._validar_obra(empresa_id, obra_id)
        self._validar_liquidacao(status_conta, data_recebimento)

        conta = ContaReceber(
            id=uuid.uuid4(),
            empresa_id=empresa_id,
            descricao=descricao.strip(),
            valor=valor,
            data_vencimento=data_vencimento,
            cliente_id=cliente_id,
            obra_id=obra_id,
            data_recebimento=data_recebimento,
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
        cliente_id: UUID | None,
        obra_id: UUID | None,
        data_recebimento: date | None,
        status_conta: StatusConta,
        observacoes: str | None,
    ) -> ContaReceber:
        existente = self.obter(empresa_id, conta_id)
        self._validar_cliente(empresa_id, cliente_id)
        self._validar_obra(empresa_id, obra_id)
        self._validar_liquidacao(status_conta, data_recebimento)

        atualizada = replace(
            existente,
            descricao=descricao.strip(),
            valor=valor,
            data_vencimento=data_vencimento,
            cliente_id=cliente_id,
            obra_id=obra_id,
            data_recebimento=data_recebimento,
            status=status_conta,
            observacoes=observacoes,
        )
        return self.repository.update(atualizada)

    def remover(self, empresa_id: UUID, conta_id: UUID) -> None:
        removida = self.repository.delete(empresa_id, conta_id)
        if not removida:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta a receber não encontrada.")
