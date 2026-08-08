from __future__ import annotations
"""Casos de uso do módulo Bancário. Camada: Application."""
import uuid
from dataclasses import replace
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.banco import ContaBancaria, LancamentoBancario, TipoConta, TipoLancamento
from app.domain.repositories.banco_repository import ContaBancariaRepository, LancamentoBancarioRepository


class BancoUseCases:
    def __init__(self, contas_repo: ContaBancariaRepository, lanc_repo: LancamentoBancarioRepository):
        self.contas = contas_repo
        self.lancamentos = lanc_repo

    # --- Contas ---

    def listar_contas(self, empresa_id: UUID) -> list[dict]:
        contas = self.contas.list(empresa_id)
        result = []
        for c in contas:
            saldo = self.lancamentos.saldo_conta(empresa_id, c.id)
            result.append({**c.__dict__, "saldo_atual": saldo})
        return result

    def obter_conta(self, empresa_id: UUID, conta_id: UUID) -> ContaBancaria:
        conta = self.contas.get_by_id(empresa_id, conta_id)
        if not conta:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta não encontrada.")
        return conta

    def criar_conta(self, empresa_id: UUID, nome: str, banco: str | None, agencia: str | None,
                    numero_conta: str | None, tipo: TipoConta, saldo_inicial: float,
                    observacoes: str | None) -> ContaBancaria:
        conta = ContaBancaria(
            id=uuid.uuid4(), empresa_id=empresa_id, nome=nome.strip(),
            banco=banco, agencia=agencia, numero_conta=numero_conta,
            tipo=tipo, saldo_inicial=saldo_inicial, observacoes=observacoes,
        )
        return self.contas.create(conta)

    def atualizar_conta(self, empresa_id: UUID, conta_id: UUID, nome: str, banco: str | None,
                        agencia: str | None, numero_conta: str | None, tipo: TipoConta,
                        saldo_inicial: float, observacoes: str | None) -> ContaBancaria:
        existente = self.obter_conta(empresa_id, conta_id)
        atualizada = replace(existente, nome=nome.strip(), banco=banco, agencia=agencia,
                             numero_conta=numero_conta, tipo=tipo, saldo_inicial=saldo_inicial,
                             observacoes=observacoes)
        return self.contas.update(atualizada)

    def remover_conta(self, empresa_id: UUID, conta_id: UUID) -> None:
        if not self.contas.delete(empresa_id, conta_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conta não encontrada.")

    # --- Lançamentos ---

    def listar_lancamentos(self, empresa_id: UUID, conta_id: UUID | None,
                           page: int, page_size: int) -> tuple[list[LancamentoBancario], int]:
        page = max(page, 1); page_size = min(max(page_size, 1), 100)
        return self.lancamentos.list(empresa_id, conta_id, page, page_size)

    def criar_lancamento(self, empresa_id: UUID, conta_id: UUID, tipo: TipoLancamento,
                         valor: float, descricao: str, data: date, categoria: str | None,
                         referencia: str | None) -> LancamentoBancario:
        self.obter_conta(empresa_id, conta_id)  # valida que a conta existe
        if valor <= 0:
            raise HTTPException(status_code=422, detail="O valor deve ser maior que zero.")
        lanc = LancamentoBancario(
            id=uuid.uuid4(), empresa_id=empresa_id, conta_id=conta_id,
            tipo=tipo, valor=valor, descricao=descricao.strip(),
            data=data, categoria=categoria, referencia=referencia,
        )
        return self.lancamentos.create(lanc)

    def remover_lancamento(self, empresa_id: UUID, lancamento_id: UUID) -> None:
        if not self.lancamentos.delete(empresa_id, lancamento_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lançamento não encontrado.")

    def saldo_total(self, empresa_id: UUID) -> dict:
        contas = self.contas.list(empresa_id)
        saldos = {}
        total = 0.0
        for c in contas:
            s = self.lancamentos.saldo_conta(empresa_id, c.id)
            saldos[str(c.id)] = {"nome": c.nome, "saldo": s}
            total += s
        return {"total": round(total, 2), "por_conta": saldos}
