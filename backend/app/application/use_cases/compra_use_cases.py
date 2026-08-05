"""
Casos de uso do módulo Compras. Camada: Application.
"""
import uuid
from dataclasses import replace
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.compra import Compra, StatusCompra
from app.domain.repositories.compra_repository import CompraRepository
from app.domain.repositories.obra_repository import ObraRepository


class CompraUseCases:
    def __init__(self, repository: CompraRepository, obra_repository: ObraRepository):
        self.repository = repository
        self.obra_repository = obra_repository

    def _validar_obra(self, empresa_id: UUID, obra_id: UUID | None) -> None:
        if obra_id and self.obra_repository.get_by_id(empresa_id, obra_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Obra informada não foi encontrada nesta empresa.",
            )

    def listar(
        self, empresa_id: UUID, search: str | None, status_filtro: StatusCompra | None, page: int, page_size: int
    ) -> tuple[list[dict], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.repository.list_with_obra_nome(empresa_id, search, status_filtro, page, page_size)

    def obter(self, empresa_id: UUID, compra_id: UUID) -> Compra:
        compra = self.repository.get_by_id(empresa_id, compra_id)
        if compra is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra não encontrada.")
        return compra

    def criar(
        self,
        empresa_id: UUID,
        fornecedor: str,
        produto: str,
        quantidade: float,
        valor_unitario: float,
        data_compra: date,
        unidade: str | None,
        obra_id: UUID | None,
        status_compra: StatusCompra,
        observacoes: str | None,
    ) -> Compra:
        self._validar_obra(empresa_id, obra_id)

        compra = Compra(
            id=uuid.uuid4(),
            empresa_id=empresa_id,
            fornecedor=fornecedor.strip(),
            produto=produto.strip(),
            quantidade=quantidade,
            unidade=unidade,
            valor_unitario=valor_unitario,
            data_compra=data_compra,
            obra_id=obra_id,
            status=status_compra,
            observacoes=observacoes,
        )
        return self.repository.create(compra)

    def atualizar(
        self,
        empresa_id: UUID,
        compra_id: UUID,
        fornecedor: str,
        produto: str,
        quantidade: float,
        valor_unitario: float,
        data_compra: date,
        unidade: str | None,
        obra_id: UUID | None,
        status_compra: StatusCompra,
        observacoes: str | None,
    ) -> Compra:
        existente = self.obter(empresa_id, compra_id)
        self._validar_obra(empresa_id, obra_id)

        atualizada = replace(
            existente,
            fornecedor=fornecedor.strip(),
            produto=produto.strip(),
            quantidade=quantidade,
            unidade=unidade,
            valor_unitario=valor_unitario,
            data_compra=data_compra,
            obra_id=obra_id,
            status=status_compra,
            observacoes=observacoes,
        )
        return self.repository.update(atualizada)

    def remover(self, empresa_id: UUID, compra_id: UUID) -> None:
        removida = self.repository.delete(empresa_id, compra_id)
        if not removida:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra não encontrada.")
