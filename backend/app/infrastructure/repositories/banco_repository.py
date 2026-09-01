"""Implementações SQLAlchemy dos repositórios bancários. Camada: Infrastructure."""
from __future__ import annotations
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domain.entities.banco import ContaBancaria, LancamentoBancario, TipoConta, TipoLancamento
from app.domain.repositories.banco_repository import ContaBancariaRepository, LancamentoBancarioRepository
from app.infrastructure.database.models.banco import ContaBancariaModel, LancamentoBancarioModel
from app.infrastructure.database.soft_delete import soft_delete


def _conta_to_entity(m: ContaBancariaModel) -> ContaBancaria:
    return ContaBancaria(
        id=m.id, empresa_id=m.empresa_id, nome=m.nome, banco=m.banco,
        agencia=m.agencia, numero_conta=m.numero_conta,
        tipo=TipoConta(m.tipo), saldo_inicial=float(m.saldo_inicial or 0),
        ativo=m.ativo, observacoes=m.observacoes, criado_em=m.criado_em,
    )


def _lanc_to_entity(m: LancamentoBancarioModel) -> LancamentoBancario:
    return LancamentoBancario(
        id=m.id, empresa_id=m.empresa_id, conta_id=m.conta_id,
        tipo=TipoLancamento(m.tipo), valor=float(m.valor),
        descricao=m.descricao, data=m.data, categoria=m.categoria,
        referencia=m.referencia, criado_em=m.criado_em,
    )


class SqlAlchemyContaBancariaRepository(ContaBancariaRepository):
    def __init__(self, db: Session): self.db = db

    def list(self, empresa_id: UUID) -> list[ContaBancaria]:
        rows = self.db.query(ContaBancariaModel).filter(
            ContaBancariaModel.empresa_id == empresa_id,
            ContaBancariaModel.ativo == True,
        ).order_by(ContaBancariaModel.nome).all()
        return [_conta_to_entity(r) for r in rows]

    def get_by_id(self, empresa_id: UUID, conta_id: UUID) -> ContaBancaria | None:
        m = self.db.query(ContaBancariaModel).filter(
            ContaBancariaModel.empresa_id == empresa_id,
            ContaBancariaModel.id == conta_id,
        ).first()
        return _conta_to_entity(m) if m else None

    def create(self, conta: ContaBancaria) -> ContaBancaria:
        m = ContaBancariaModel(
            id=conta.id, empresa_id=conta.empresa_id, nome=conta.nome,
            banco=conta.banco, agencia=conta.agencia, numero_conta=conta.numero_conta,
            tipo=conta.tipo.value, saldo_inicial=conta.saldo_inicial,
            ativo=conta.ativo, observacoes=conta.observacoes,
        )
        self.db.add(m); self.db.commit(); self.db.refresh(m)
        return _conta_to_entity(m)

    def update(self, conta: ContaBancaria) -> ContaBancaria:
        m = self.db.query(ContaBancariaModel).filter(
            ContaBancariaModel.empresa_id == conta.empresa_id,
            ContaBancariaModel.id == conta.id,
        ).first()
        if not m: raise ValueError("Conta não encontrada")
        m.nome = conta.nome; m.banco = conta.banco; m.agencia = conta.agencia
        m.numero_conta = conta.numero_conta; m.tipo = conta.tipo.value
        m.saldo_inicial = conta.saldo_inicial; m.ativo = conta.ativo
        m.observacoes = conta.observacoes
        self.db.commit(); self.db.refresh(m)
        return _conta_to_entity(m)

    def delete(self, empresa_id: UUID, conta_id: UUID) -> bool:
        m = self.db.query(ContaBancariaModel).filter(
            ContaBancariaModel.empresa_id == empresa_id,
            ContaBancariaModel.id == conta_id,
        ).first()
        if not m: return False
        # Soft delete — preserva histórico de lançamentos
        m.ativo = False
        self.db.commit()
        return True


class SqlAlchemyLancamentoBancarioRepository(LancamentoBancarioRepository):
    def __init__(self, db: Session): self.db = db

    def list(self, empresa_id: UUID, conta_id: UUID | None, page: int, page_size: int) -> tuple[list[LancamentoBancario], int]:
        q = self.db.query(LancamentoBancarioModel).filter(LancamentoBancarioModel.empresa_id == empresa_id)
        if conta_id:
            q = q.filter(LancamentoBancarioModel.conta_id == conta_id)
        total = q.with_entities(func.count(LancamentoBancarioModel.id)).scalar() or 0
        rows = q.order_by(LancamentoBancarioModel.data.desc(), LancamentoBancarioModel.criado_em.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return [_lanc_to_entity(r) for r in rows], total

    def get_by_id(self, empresa_id: UUID, lancamento_id: UUID) -> LancamentoBancario | None:
        m = self.db.query(LancamentoBancarioModel).filter(
            LancamentoBancarioModel.empresa_id == empresa_id,
            LancamentoBancarioModel.id == lancamento_id,
        ).first()
        return _lanc_to_entity(m) if m else None

    def create(self, lanc: LancamentoBancario) -> LancamentoBancario:
        m = LancamentoBancarioModel(
            id=lanc.id, empresa_id=lanc.empresa_id, conta_id=lanc.conta_id,
            tipo=lanc.tipo.value, valor=lanc.valor, descricao=lanc.descricao,
            data=lanc.data, categoria=lanc.categoria, referencia=lanc.referencia,
        )
        self.db.add(m); self.db.commit(); self.db.refresh(m)
        return _lanc_to_entity(m)

    def delete(self, empresa_id: UUID, lancamento_id: UUID) -> bool:
        m = self.db.query(LancamentoBancarioModel).filter(
            LancamentoBancarioModel.empresa_id == empresa_id,
            LancamentoBancarioModel.id == lancamento_id,
        ).first()
        if not m: return False
        soft_delete(self.db, m)
        return True

    def saldo_conta(self, empresa_id: UUID, conta_id: UUID) -> float:
        """Saldo = saldo_inicial + entradas - saídas."""
        conta = self.db.query(ContaBancariaModel).filter(
            ContaBancariaModel.empresa_id == empresa_id,
            ContaBancariaModel.id == conta_id,
        ).first()
        saldo_inicial = float(conta.saldo_inicial or 0) if conta else 0.0

        entradas = self.db.query(func.sum(LancamentoBancarioModel.valor)).filter(
            LancamentoBancarioModel.empresa_id == empresa_id,
            LancamentoBancarioModel.conta_id == conta_id,
            LancamentoBancarioModel.tipo == TipoLancamento.ENTRADA.value,
        ).scalar() or 0

        saidas = self.db.query(func.sum(LancamentoBancarioModel.valor)).filter(
            LancamentoBancarioModel.empresa_id == empresa_id,
            LancamentoBancarioModel.conta_id == conta_id,
            LancamentoBancarioModel.tipo == TipoLancamento.SAIDA.value,
        ).scalar() or 0

        return round(saldo_inicial + float(entradas) - float(saidas), 2)

    def saldos_por_conta(self, empresa_id: UUID) -> dict[UUID, float]:
        """
        Versão em LOTE de saldo_conta: devolve o saldo de TODAS as contas da
        empresa em 2 queries fixas, em vez de 3 queries POR CONTA.

        Antes (em listar_contas): com 5 contas bancárias eram 1 + (5 x 3) =
        16 idas ao banco só para montar a listagem. Agora são 2,
        independentemente da quantidade de contas.

        O isolamento multi-tenant é preservado: as duas queries filtram por
        empresa_id, exatamente como a versão individual.
        """
        contas = self.db.query(
            ContaBancariaModel.id, ContaBancariaModel.saldo_inicial
        ).filter(ContaBancariaModel.empresa_id == empresa_id).all()

        # Uma query só, agrupando por conta E por tipo — evita precisar de
        # duas queries separadas para entrada e saída.
        movimentos = self.db.query(
            LancamentoBancarioModel.conta_id,
            LancamentoBancarioModel.tipo,
            func.coalesce(func.sum(LancamentoBancarioModel.valor), 0),
        ).filter(
            LancamentoBancarioModel.empresa_id == empresa_id,
        ).group_by(
            LancamentoBancarioModel.conta_id, LancamentoBancarioModel.tipo
        ).all()

        totais: dict[UUID, float] = {}
        for conta_id, tipo, soma in movimentos:
            valor = float(soma or 0)
            if tipo == TipoLancamento.ENTRADA.value:
                totais[conta_id] = totais.get(conta_id, 0.0) + valor
            elif tipo == TipoLancamento.SAIDA.value:
                totais[conta_id] = totais.get(conta_id, 0.0) - valor

        return {
            conta_id: round(float(saldo_inicial or 0) + totais.get(conta_id, 0.0), 2)
            for conta_id, saldo_inicial in contas
        }
