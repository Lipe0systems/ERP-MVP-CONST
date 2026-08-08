"""
Casos de uso do módulo Estoque. Camada: Application.
"""
from __future__ import annotations
import uuid
from dataclasses import replace
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.estoque import ItemEstoque
from app.domain.exceptions import DuplicateValueError
from app.domain.repositories.estoque_repository import EstoqueRepository


class EstoqueUseCases:
    def __init__(self, repository: EstoqueRepository):
        self.repository = repository

    def listar(
        self, empresa_id: UUID, search: str | None, page: int, page_size: int
    ) -> tuple[list[ItemEstoque], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.repository.list(empresa_id, search, page, page_size)

    def obter(self, empresa_id: UUID, item_id: UUID) -> ItemEstoque:
        item = self.repository.get_by_id(empresa_id, item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item de estoque não encontrado.")
        return item

    def criar(
        self,
        empresa_id: UUID,
        produto: str,
        quantidade: float,
        valor_medio: float,
        unidade: str | None,
        observacoes: str | None,
    ) -> ItemEstoque:
        produto = produto.strip()
        if self.repository.get_by_produto(empresa_id, produto):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um item de estoque cadastrado com este produto.",
            )

        item = ItemEstoque(
            id=uuid.uuid4(),
            empresa_id=empresa_id,
            produto=produto,
            quantidade=quantidade,
            unidade=unidade,
            valor_medio=valor_medio,
            observacoes=observacoes,
        )
        try:
            return self.repository.create(item)
        except DuplicateValueError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    def atualizar(
        self,
        empresa_id: UUID,
        item_id: UUID,
        produto: str,
        quantidade: float,
        valor_medio: float,
        unidade: str | None,
        observacoes: str | None,
    ) -> ItemEstoque:
        existente = self.obter(empresa_id, item_id)
        produto = produto.strip()

        if produto.lower() != existente.produto.lower():
            duplicado = self.repository.get_by_produto(empresa_id, produto)
            if duplicado and duplicado.id != item_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Já existe um item de estoque cadastrado com este produto.",
                )

        atualizado = replace(
            existente,
            produto=produto,
            quantidade=quantidade,
            unidade=unidade,
            valor_medio=valor_medio,
            observacoes=observacoes,
        )
        try:
            return self.repository.update(atualizado)
        except DuplicateValueError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    def remover(self, empresa_id: UUID, item_id: UUID) -> None:
        removido = self.repository.delete(empresa_id, item_id)
        if not removido:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item de estoque não encontrado.")
