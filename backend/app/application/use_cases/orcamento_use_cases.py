"""
Casos de uso do módulo Orçamentos. Camada: Application.

A lógica mais importante está em aprovar() e cancelar():
- aprovar(): dá baixa real no Estoque (itens vinculados) e gera uma Conta a
  Receber pendente com vencimento em 30 dias. Se qualquer item não tiver
  estoque suficiente, a aprovação inteira é bloqueada (nada é alterado).
- cancelar(): reverte as baixas do Estoque e cancela a Conta a Receber gerada.
"""
import uuid
from dataclasses import replace
from datetime import date, timedelta
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.financeiro import ContaReceber, StatusConta
from app.domain.entities.orcamento import Orcamento, OrcamentoItem, StatusOrcamento
from app.domain.exceptions import EstoqueInsuficienteError
from app.domain.repositories.cliente_repository import ClienteRepository
from app.domain.repositories.conta_receber_repository import ContaReceberRepository
from app.domain.repositories.estoque_repository import EstoqueRepository
from app.domain.repositories.obra_repository import ObraRepository
from app.domain.repositories.orcamento_repository import OrcamentoRepository

PRAZO_VENCIMENTO_DIAS = 30


class OrcamentoUseCases:
    def __init__(
        self,
        repository: OrcamentoRepository,
        cliente_repository: ClienteRepository,
        obra_repository: ObraRepository,
        estoque_repository: EstoqueRepository,
        conta_receber_repository: ContaReceberRepository,
    ):
        self.repository = repository
        self.cliente_repo = cliente_repository
        self.obra_repo = obra_repository
        self.estoque_repo = estoque_repository
        self.conta_receber_repo = conta_receber_repository

    def _validar_cliente(self, empresa_id: UUID, cliente_id: UUID) -> None:
        if self.cliente_repo.get_by_id(empresa_id, cliente_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente informado não foi encontrado nesta empresa.",
            )

    def _validar_obra(self, empresa_id: UUID, obra_id: UUID | None) -> None:
        if obra_id and self.obra_repo.get_by_id(empresa_id, obra_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Obra informada não foi encontrada nesta empresa.",
            )

    def listar(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: StatusOrcamento | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.repository.list_with_relacionamentos(
            empresa_id, search, status_filtro, page, page_size
        )

    def obter(self, empresa_id: UUID, orcamento_id: UUID) -> Orcamento:
        orc = self.repository.get_by_id(empresa_id, orcamento_id)
        if orc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orçamento não encontrado.",
            )
        return orc

    def criar(
        self,
        empresa_id: UUID,
        cliente_id: UUID,
        obra_id: UUID | None,
        validade: date | None,
        observacoes: str | None,
        itens: list[dict],
    ) -> Orcamento:
        self._validar_cliente(empresa_id, cliente_id)
        self._validar_obra(empresa_id, obra_id)

        if not itens:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="O orçamento precisa ter ao menos um item.",
            )

        numero = self.repository.next_numero(empresa_id)
        orcamento_id = uuid.uuid4()

        orcamento_itens = [
            OrcamentoItem(
                id=uuid.uuid4(),
                orcamento_id=orcamento_id,
                descricao=item["descricao"].strip(),
                quantidade=item["quantidade"],
                valor_unitario=item["valor_unitario"],
                unidade=item.get("unidade"),
                estoque_id=item.get("estoque_id"),
            )
            for item in itens
        ]

        orcamento = Orcamento(
            id=orcamento_id,
            empresa_id=empresa_id,
            cliente_id=cliente_id,
            numero=numero,
            obra_id=obra_id,
            validade=validade,
            observacoes=observacoes,
            itens=orcamento_itens,
        )
        return self.repository.create(orcamento)

    def atualizar(
        self,
        empresa_id: UUID,
        orcamento_id: UUID,
        cliente_id: UUID,
        obra_id: UUID | None,
        validade: date | None,
        observacoes: str | None,
        itens: list[dict],
    ) -> Orcamento:
        existente = self.obter(empresa_id, orcamento_id)

        if existente.status != StatusOrcamento.RASCUNHO:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Só é possível editar orçamentos com status 'Rascunho'.",
            )

        self._validar_cliente(empresa_id, cliente_id)
        self._validar_obra(empresa_id, obra_id)

        if not itens:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="O orçamento precisa ter ao menos um item.",
            )

        novos_itens = [
            OrcamentoItem(
                id=uuid.uuid4(),
                orcamento_id=orcamento_id,
                descricao=item["descricao"].strip(),
                quantidade=item["quantidade"],
                valor_unitario=item["valor_unitario"],
                unidade=item.get("unidade"),
                estoque_id=item.get("estoque_id"),
            )
            for item in itens
        ]

        atualizado = replace(
            existente,
            cliente_id=cliente_id,
            obra_id=obra_id,
            validade=validade,
            observacoes=observacoes,
            itens=novos_itens,
        )
        return self.repository.update(atualizado)

    def aprovar(self, empresa_id: UUID, orcamento_id: UUID) -> Orcamento:
        """
        Fluxo de aprovação:
        1. Verifica estoque suficiente para TODOS os itens vinculados (tudo ou nada)
        2. Dá baixa real no estoque
        3. Gera uma Conta a Receber pendente (vencimento em 30 dias)
        4. Marca o orçamento como Aprovado
        """
        orc = self.obter(empresa_id, orcamento_id)

        if orc.status != StatusOrcamento.RASCUNHO:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Só é possível aprovar orçamentos com status 'Rascunho'.",
            )

        # 1. Verificar estoque ANTES de dar qualquer baixa (tudo ou nada)
        itens_com_estoque = []
        for item in orc.itens:
            if item.estoque_id:
                estoque_item = self.estoque_repo.get_by_id(empresa_id, item.estoque_id)
                if estoque_item is None:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"Item de estoque não encontrado para '{item.descricao}'.",
                    )
                if estoque_item.quantidade < item.quantidade:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=(
                            f"Estoque insuficiente para '{item.descricao}': "
                            f"disponível {estoque_item.quantidade}, necessário {item.quantidade}."
                        ),
                    )
                itens_com_estoque.append((item, estoque_item))

        # 2. Dar baixa real
        for item, estoque_item in itens_com_estoque:
            estoque_atualizado = replace(
                estoque_item,
                quantidade=round(estoque_item.quantidade - item.quantidade, 3),
            )
            self.estoque_repo.update(estoque_atualizado)

        # 3. Gerar Conta a Receber
        conta = ContaReceber(
            id=uuid.uuid4(),
            empresa_id=empresa_id,
            descricao=f"Orçamento #{orc.numero}",
            valor=orc.valor_total,
            data_vencimento=date.today() + timedelta(days=PRAZO_VENCIMENTO_DIAS),
            cliente_id=orc.cliente_id,
            obra_id=orc.obra_id,
            status=StatusConta.PENDENTE,
            observacoes=f"Gerado automaticamente pela aprovação do orçamento #{orc.numero}.",
        )
        conta_criada = self.conta_receber_repo.create(conta)

        # 4. Marcar como aprovado
        aprovado = replace(
            orc,
            status=StatusOrcamento.APROVADO,
            conta_receber_id=conta_criada.id,
        )
        return self.repository.update(aprovado)

    def recusar(self, empresa_id: UUID, orcamento_id: UUID) -> Orcamento:
        orc = self.obter(empresa_id, orcamento_id)
        if orc.status != StatusOrcamento.RASCUNHO:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Só é possível recusar orçamentos com status 'Rascunho'.",
            )
        recusado = replace(orc, status=StatusOrcamento.RECUSADO)
        return self.repository.update(recusado)

    def cancelar(self, empresa_id: UUID, orcamento_id: UUID) -> Orcamento:
        """
        Reverte a aprovação:
        1. Estorna a baixa do estoque (devolve a quantidade)
        2. Cancela a Conta a Receber vinculada
        3. Marca o orçamento como Cancelado
        """
        orc = self.obter(empresa_id, orcamento_id)
        if orc.status != StatusOrcamento.APROVADO:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Só é possível cancelar orçamentos com status 'Aprovado'.",
            )

        # 1. Estornar estoque
        for item in orc.itens:
            if item.estoque_id:
                estoque_item = self.estoque_repo.get_by_id(empresa_id, item.estoque_id)
                if estoque_item:
                    estorno = replace(
                        estoque_item,
                        quantidade=round(estoque_item.quantidade + item.quantidade, 3),
                    )
                    self.estoque_repo.update(estorno)

        # 2. Cancelar Conta a Receber
        if orc.conta_receber_id:
            conta = self.conta_receber_repo.get_by_id(empresa_id, orc.conta_receber_id)
            if conta and conta.status != StatusConta.CANCELADO:
                conta_cancelada = replace(conta, status=StatusConta.CANCELADO)
                self.conta_receber_repo.update(conta_cancelada)

        # 3. Marcar como cancelado
        cancelado = replace(
            orc,
            status=StatusOrcamento.CANCELADO,
        )
        return self.repository.update(cancelado)

    def remover(self, empresa_id: UUID, orcamento_id: UUID) -> None:
        orc = self.obter(empresa_id, orcamento_id)
        if orc.status not in (StatusOrcamento.RASCUNHO, StatusOrcamento.RECUSADO):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Só é possível excluir orçamentos com status 'Rascunho' ou 'Recusado'.",
            )
        removido = self.repository.delete(empresa_id, orcamento_id)
        if not removido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orçamento não encontrado.",
            )
