"""
Casos de uso do módulo Recorrência Financeira. Camada: Application.

A geração de contas funciona assim:
- Cada recorrência tem um "dia de vencimento" fixo (ex.: dia 10).
- Ao rodar `gerar_pendentes`, o sistema verifica quantos meses faltam gerar
  desde a última geração (ou desde a criação, se nunca gerou) até o mês
  atual + `meses_a_frente` — e cria uma Conta a Pagar/Receber para cada mês
  faltante, marcando `ultima_geracao` para não duplicar.
"""
from __future__ import annotations
import calendar
import uuid
from dataclasses import replace
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.financeiro import ContaPagar, ContaReceber, StatusConta
from app.domain.entities.recorrencia import RecorrenciaFinanceira, TipoRecorrencia
from app.domain.repositories.conta_pagar_repository import ContaPagarRepository
from app.domain.repositories.conta_receber_repository import ContaReceberRepository
from app.domain.repositories.recorrencia_repository import RecorrenciaRepository


def _add_meses(d: date, meses: int) -> date:
    mes_total = d.month - 1 + meses
    ano = d.year + mes_total // 12
    mes = mes_total % 12 + 1
    ultimo_dia = calendar.monthrange(ano, mes)[1]
    dia = min(d.day, ultimo_dia)
    return date(ano, mes, dia)


class RecorrenciaUseCases:
    def __init__(
        self,
        repository: RecorrenciaRepository,
        conta_pagar_repository: ContaPagarRepository,
        conta_receber_repository: ContaReceberRepository,
    ):
        self.repository = repository
        self.cp_repo = conta_pagar_repository
        self.cr_repo = conta_receber_repository

    def listar(self, empresa_id: UUID, ativo: bool | None) -> list[RecorrenciaFinanceira]:
        return self.repository.list(empresa_id, ativo)

    def obter(self, empresa_id: UUID, recorrencia_id: UUID) -> RecorrenciaFinanceira:
        r = self.repository.get_by_id(empresa_id, recorrencia_id)
        if not r:
            raise HTTPException(status_code=404, detail="Recorrência não encontrada.")
        return r

    def criar(self, empresa_id: UUID, tipo: TipoRecorrencia, descricao: str, valor: float,
              dia_vencimento: int, fornecedor: str | None, cliente_id: UUID | None,
              obra_id: UUID | None, categoria: str | None, observacoes: str | None,
              gerar_mes_atual: bool = True) -> RecorrenciaFinanceira:
        if not (1 <= dia_vencimento <= 28):
            raise HTTPException(status_code=422, detail="Dia de vencimento deve estar entre 1 e 28.")

        r = RecorrenciaFinanceira(
            id=uuid.uuid4(), empresa_id=empresa_id, tipo=tipo,
            descricao=descricao.strip(), valor=valor, dia_vencimento=dia_vencimento,
            fornecedor=fornecedor, cliente_id=cliente_id, obra_id=obra_id,
            categoria=categoria, observacoes=observacoes,
        )
        criada = self.repository.create(r)

        if gerar_mes_atual:
            self._gerar_conta_do_mes(criada, date.today())
            criada = replace(criada, ultima_geracao=date.today())
            criada = self.repository.update(criada)

        return criada

    def atualizar(self, empresa_id: UUID, recorrencia_id: UUID, descricao: str, valor: float,
                  dia_vencimento: int, ativo: bool, fornecedor: str | None,
                  cliente_id: UUID | None, obra_id: UUID | None,
                  categoria: str | None, observacoes: str | None) -> RecorrenciaFinanceira:
        existente = self.obter(empresa_id, recorrencia_id)
        atualizada = replace(
            existente, descricao=descricao.strip(), valor=valor,
            dia_vencimento=dia_vencimento, ativo=ativo, fornecedor=fornecedor,
            cliente_id=cliente_id, obra_id=obra_id, categoria=categoria,
            observacoes=observacoes,
        )
        return self.repository.update(atualizada)

    def remover(self, empresa_id: UUID, recorrencia_id: UUID) -> None:
        if not self.repository.delete(empresa_id, recorrencia_id):
            raise HTTPException(status_code=404, detail="Recorrência não encontrada.")

    def _gerar_conta_do_mes(self, r: RecorrenciaFinanceira, referencia: date) -> None:
        ultimo_dia = calendar.monthrange(referencia.year, referencia.month)[1]
        vencimento = date(referencia.year, referencia.month, min(r.dia_vencimento, ultimo_dia))

        if r.tipo == TipoRecorrencia.PAGAR:
            self.cp_repo.create(ContaPagar(
                id=uuid.uuid4(), empresa_id=r.empresa_id,
                descricao=f"{r.descricao} ({vencimento.strftime('%m/%Y')})",
                valor=r.valor, data_vencimento=vencimento,
                fornecedor=r.fornecedor, obra_id=r.obra_id, categoria=r.categoria,
                status=StatusConta.PENDENTE,
                observacoes="Gerado por recorrência automática.",
            ))
        else:
            self.cr_repo.create(ContaReceber(
                id=uuid.uuid4(), empresa_id=r.empresa_id,
                descricao=f"{r.descricao} ({vencimento.strftime('%m/%Y')})",
                valor=r.valor, data_vencimento=vencimento,
                cliente_id=r.cliente_id, obra_id=r.obra_id,
                status=StatusConta.PENDENTE,
                observacoes="Gerado por recorrência automática.",
            ))

    def gerar_pendentes(self, empresa_id: UUID | None = None, meses_a_frente: int = 1) -> dict:
        """
        Gera contas para todas as recorrências ativas que ainda não tiveram
        o mês atual (ou seguintes, conforme meses_a_frente) gerado.
        Se empresa_id for None, roda para todas as empresas (job global).
        """
        recorrencias = (
            self.repository.list(empresa_id, ativo=True)
            if empresa_id else self.repository.list_todas_ativas()
        )

        geradas = 0
        hoje = date.today()
        limite = _add_meses(hoje.replace(day=1), meses_a_frente)

        for r in recorrencias:
            referencia = (
                _add_meses(r.ultima_geracao.replace(day=1), 1)
                if r.ultima_geracao else hoje.replace(day=1)
            )
            while referencia <= limite:
                self._gerar_conta_do_mes(r, referencia)
                geradas += 1
                r = replace(r, ultima_geracao=referencia)
                referencia = _add_meses(referencia, 1)
            if r.ultima_geracao:
                self.repository.update(r)

        return {"contas_geradas": geradas}
