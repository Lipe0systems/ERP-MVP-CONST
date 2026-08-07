"""Casos de uso do módulo Fornecedores. Camada: Application."""
import uuid
from dataclasses import replace
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.fornecedor import Fornecedor
from app.domain.repositories.fornecedor_repository import FornecedorRepository


class FornecedorUseCases:
    def __init__(self, repository: FornecedorRepository):
        self.repository = repository

    def listar(self, empresa_id: UUID, search: str | None, page: int, page_size: int) -> tuple[list[Fornecedor], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.repository.list(empresa_id, search, page, page_size)

    def obter(self, empresa_id: UUID, fornecedor_id: UUID) -> Fornecedor:
        f = self.repository.get_by_id(empresa_id, fornecedor_id)
        if f is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fornecedor não encontrado.")
        return f

    def criar(self, empresa_id: UUID, nome: str, documento: str | None, email: str | None,
              telefone: str | None, endereco: str | None, observacoes: str | None) -> Fornecedor:
        fornecedor = Fornecedor(
            id=uuid.uuid4(), empresa_id=empresa_id, nome=nome.strip(),
            documento=documento, email=email, telefone=telefone,
            endereco=endereco, observacoes=observacoes,
        )
        return self.repository.create(fornecedor)

    def atualizar(self, empresa_id: UUID, fornecedor_id: UUID, nome: str, documento: str | None,
                  email: str | None, telefone: str | None, endereco: str | None, observacoes: str | None) -> Fornecedor:
        existente = self.obter(empresa_id, fornecedor_id)
        atualizado = replace(
            existente, nome=nome.strip(), documento=documento, email=email,
            telefone=telefone, endereco=endereco, observacoes=observacoes,
        )
        return self.repository.update(atualizado)

    def remover(self, empresa_id: UUID, fornecedor_id: UUID) -> None:
        if not self.repository.delete(empresa_id, fornecedor_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fornecedor não encontrado.")
