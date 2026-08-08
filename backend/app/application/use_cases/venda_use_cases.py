"""
Casos de uso do módulo Vendas. Camada: Application.

Fluxo principal: criar venda (a partir de orçamento ou do zero)
→ gera parcelas automaticamente → cada parcela cria uma Conta a Receber.
"""
from __future__ import annotations
import uuid
from dataclasses import replace
from datetime import date, timedelta
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.financeiro import ContaReceber, StatusConta
from app.domain.entities.orcamento import StatusOrcamento
from app.domain.entities.venda import FormaPagamento, ParcelaVenda, StatusVenda, Venda
from app.domain.repositories.conta_receber_repository import ContaReceberRepository
from app.domain.repositories.orcamento_repository import OrcamentoRepository
from app.domain.repositories.venda_repository import VendaRepository


class VendaUseCases:
    def __init__(
        self,
        repository: VendaRepository,
        orcamento_repository: OrcamentoRepository,
        conta_receber_repository: ContaReceberRepository,
    ):
        self.repository = repository
        self.orc_repo = orcamento_repository
        self.cr_repo = conta_receber_repository

    def listar(self, empresa_id: UUID, status_filtro: StatusVenda | None,
               page: int, page_size: int) -> tuple[list[dict], int]:
        page = max(page, 1); page_size = min(max(page_size, 1), 100)
        return self.repository.list(empresa_id, status_filtro, page, page_size)

    def obter(self, empresa_id: UUID, venda_id: UUID) -> Venda:
        v = self.repository.get_by_id(empresa_id, venda_id)
        if not v:
            raise HTTPException(status_code=404, detail="Venda não encontrada.")
        return v

    def criar_de_orcamento(self, empresa_id: UUID, orcamento_id: UUID,
                           forma_pagamento: FormaPagamento, num_parcelas: int,
                           dias_primeiro_vencimento: int, desconto: float,
                           observacoes: str | None) -> Venda:
        """Converte um orçamento aprovado em venda com 1 clique."""
        orc = self.orc_repo.get_by_id(empresa_id, orcamento_id)
        if not orc:
            raise HTTPException(status_code=404, detail="Orçamento não encontrado.")
        if orc.status != StatusOrcamento.APROVADO:
            raise HTTPException(status_code=422, detail="Só é possível gerar venda de orçamentos aprovados.")

        return self._criar_venda(
            empresa_id=empresa_id,
            cliente_id=orc.cliente_id, obra_id=orc.obra_id,
            orcamento_id=orcamento_id, valor_total=orc.valor_total,
            forma_pagamento=forma_pagamento, num_parcelas=num_parcelas,
            dias_primeiro_vencimento=dias_primeiro_vencimento,
            desconto=desconto, observacoes=observacoes,
        )

    def criar(self, empresa_id: UUID, cliente_id: UUID, obra_id: UUID | None,
              valor_total: float, forma_pagamento: FormaPagamento,
              num_parcelas: int, dias_primeiro_vencimento: int,
              desconto: float, observacoes: str | None) -> Venda:
        return self._criar_venda(
            empresa_id=empresa_id, cliente_id=cliente_id, obra_id=obra_id,
            orcamento_id=None, valor_total=valor_total,
            forma_pagamento=forma_pagamento, num_parcelas=num_parcelas,
            dias_primeiro_vencimento=dias_primeiro_vencimento,
            desconto=desconto, observacoes=observacoes,
        )

    def _criar_venda(self, empresa_id: UUID, cliente_id: UUID, obra_id: UUID | None,
                     orcamento_id: UUID | None, valor_total: float,
                     forma_pagamento: FormaPagamento, num_parcelas: int,
                     dias_primeiro_vencimento: int, desconto: float,
                     observacoes: str | None) -> Venda:
        num_parcelas = max(1, num_parcelas)
        valor_liquido = round(valor_total - desconto, 2)
        if valor_liquido <= 0:
            raise HTTPException(status_code=422, detail="Valor líquido deve ser maior que zero.")

        numero = self.repository.next_numero(empresa_id)
        venda_id = uuid.uuid4()

        # Gerar parcelas e contas a receber
        parcelas = []
        primeiro_vcto = date.today() + timedelta(days=dias_primeiro_vencimento)
        valor_parcela_base = round(valor_liquido / num_parcelas, 2)
        # Correção de centavos na última parcela
        soma_parcelas = round(valor_parcela_base * (num_parcelas - 1), 2)
        valor_ultima = round(valor_liquido - soma_parcelas, 2)

        for i in range(1, num_parcelas + 1):
            vencimento = date(
                (primeiro_vcto.replace(day=1) + timedelta(days=32 * (i - 1))).year,
                (primeiro_vcto.replace(day=1) + timedelta(days=32 * (i - 1))).month,
                min(primeiro_vcto.day,
                    [31,29,31,30,31,30,31,31,30,31,30,31][
                        ((primeiro_vcto.month - 1 + (i - 1)) % 12)
                    ])
            ) if num_parcelas > 1 else primeiro_vcto

            if num_parcelas == 1:
                vencimento = primeiro_vcto

            valor_p = valor_ultima if i == num_parcelas else valor_parcela_base

            # Criar conta a receber para esta parcela
            cr = ContaReceber(
                id=uuid.uuid4(), empresa_id=empresa_id,
                descricao=f"Venda #{numero} — Parcela {i}/{num_parcelas}",
                valor=valor_p,
                data_vencimento=vencimento,
                cliente_id=cliente_id, obra_id=obra_id,
                status=StatusConta.PENDENTE,
                observacoes=f"Gerado pela Venda #{numero}.",
            )
            cr_criada = self.cr_repo.create(cr)

            parcelas.append(ParcelaVenda(
                id=uuid.uuid4(), venda_id=venda_id,
                empresa_id=empresa_id, numero=i,
                valor=valor_p, vencimento=vencimento,
                conta_receber_id=cr_criada.id,
            ))

        venda = Venda(
            id=venda_id, empresa_id=empresa_id, numero=numero,
            cliente_id=cliente_id, orcamento_id=orcamento_id, obra_id=obra_id,
            status=StatusVenda.ABERTA, forma_pagamento=forma_pagamento,
            valor_total=valor_total, desconto=desconto,
            observacoes=observacoes, parcelas=parcelas,
        )
        return self.repository.create(venda)

    def cancelar(self, empresa_id: UUID, venda_id: UUID) -> Venda:
        venda = self.obter(empresa_id, venda_id)
        if venda.status == StatusVenda.CANCELADA:
            raise HTTPException(status_code=422, detail="Venda já está cancelada.")
        # Cancelar as contas a receber pendentes das parcelas
        for parcela in venda.parcelas:
            if parcela.conta_receber_id:
                cr = self.cr_repo.get_by_id(empresa_id, parcela.conta_receber_id)
                if cr and cr.status == StatusConta.PENDENTE:
                    from dataclasses import replace as dc_replace
                    self.cr_repo.update(dc_replace(cr, status=StatusConta.CANCELADO))
        cancelada = replace(venda, status=StatusVenda.CANCELADA)
        return self.repository.update(cancelada)
