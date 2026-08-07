"""
Casos de uso do módulo Compras. Camada: Application.
"""
import uuid
from dataclasses import replace
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.compra import Compra, StatusCompra
from app.domain.entities.estoque import ItemEstoque
from app.domain.repositories.compra_repository import CompraRepository
from app.domain.repositories.estoque_repository import EstoqueRepository
from app.domain.repositories.obra_repository import ObraRepository


class CompraUseCases:
    def __init__(
        self,
        repository: CompraRepository,
        obra_repository: ObraRepository,
        estoque_repository: EstoqueRepository | None = None,
    ):
        self.repository = repository
        self.obra_repository = obra_repository
        self.estoque_repository = estoque_repository

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

    def receber(self, empresa_id: UUID, compra_id: UUID) -> Compra:
        """
        Marca a compra como RECEBIDA e dá entrada automática no estoque.

        Lógica de entrada:
        - Se já existe um item com o mesmo nome de produto: soma a quantidade
          e recalcula o valor médio ponderado (custo médio = média ponderada
          pelo volume, não simples — evita distorção quando chegam lotes de
          tamanhos muito diferentes).
        - Se não existe: cria um item novo no estoque.

        Não bloqueia se o EstoqueRepository não estiver injetado (facilita
        testes e cenários sem módulo de estoque), mas registra o motivo.
        """
        compra = self.obter(empresa_id, compra_id)

        if compra.status == StatusCompra.RECEBIDA:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Esta compra já foi marcada como recebida.",
            )
        if compra.status == StatusCompra.CANCELADA:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Não é possível receber uma compra cancelada.",
            )

        recebida = replace(compra, status=StatusCompra.RECEBIDA)
        compra_atualizada = self.repository.update(recebida)

        if self.estoque_repository:
            self._dar_entrada_estoque(empresa_id, compra)

        return compra_atualizada

    def _dar_entrada_estoque(self, empresa_id: UUID, compra: Compra) -> None:
        """Dá entrada no estoque após recebimento da compra."""
        assert self.estoque_repository is not None

        existente = self.estoque_repository.get_by_produto(empresa_id, compra.produto)

        if existente:
            # Valor médio ponderado: (qtd_atual × vm_atual + qtd_nova × vm_novo)
            #                        / (qtd_atual + qtd_nova)
            qtd_nova = existente.quantidade + compra.quantidade
            vm_novo = round(
                (existente.quantidade * existente.valor_medio + compra.quantidade * compra.valor_unitario)
                / qtd_nova,
                2,
            )
            atualizado = replace(
                existente,
                quantidade=round(qtd_nova, 3),
                valor_medio=vm_novo,
                unidade=existente.unidade or compra.unidade,
            )
            self.estoque_repository.update(atualizado)
        else:
            # Produto ainda não está no estoque — cria
            novo_item = ItemEstoque(
                id=uuid.uuid4(),
                empresa_id=empresa_id,
                produto=compra.produto,
                quantidade=round(compra.quantidade, 3),
                valor_medio=compra.valor_unitario,
                unidade=compra.unidade,
            )
            self.estoque_repository.create(novo_item)
