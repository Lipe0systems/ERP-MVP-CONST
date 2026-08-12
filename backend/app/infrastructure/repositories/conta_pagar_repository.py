"""
Implementação SQLAlchemy do ContaPagarRepository.
Camada: Infrastructure.
"""
from __future__ import annotations
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.domain.entities.financeiro import ContaPagar, StatusConta
from app.domain.repositories.conta_pagar_repository import ContaPagarRepository
from app.infrastructure.database.models.conta_pagar import ContaPagarModel
from app.infrastructure.database.models.obra import ObraModel
from datetime import datetime


def _to_float(value) -> float | None:
    return float(value) if value is not None else None


def _to_entity(model: ContaPagarModel) -> ContaPagar:
    return ContaPagar(
        id=model.id,
        empresa_id=model.empresa_id,
        descricao=model.descricao,
        valor=_to_float(model.valor),
        data_vencimento=model.data_vencimento,
        fornecedor=model.fornecedor,
        obra_id=model.obra_id,
        categoria=model.categoria,
        data_pagamento=model.data_pagamento,
        status=StatusConta(model.status),
        observacoes=model.observacoes,
        criado_em=model.criado_em,
    )


def _to_dict_com_obra(model: ContaPagarModel, obra_nome: str | None) -> dict:
    return {
        "id": model.id,
        "descricao": model.descricao,
        "valor": _to_float(model.valor),
        "data_vencimento": model.data_vencimento,
        "fornecedor": model.fornecedor,
        "obra_id": model.obra_id,
        "obra_nome": obra_nome,
        "categoria": model.categoria,
        "data_pagamento": model.data_pagamento,
        "status": model.status,
        "observacoes": model.observacoes,
        "criado_em": model.criado_em,
    }


class SqlAlchemyContaPagarRepository(ContaPagarRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_with_obra_nome(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: StatusConta | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        # LEFT JOIN (isouter=True): obra_id é opcional, então uma conta sem
        # obra vinculada não pode ser excluída do resultado por um JOIN comum.
        query = (
            self.db.query(ContaPagarModel, ObraModel.nome)
            .outerjoin(ObraModel, ObraModel.id == ContaPagarModel.obra_id)
            .filter(ContaPagarModel.empresa_id == empresa_id)
        )

        if search:
            termo = f"%{search.strip()}%"
            query = query.filter(
                or_(ContaPagarModel.descricao.ilike(termo), ContaPagarModel.fornecedor.ilike(termo))
            )
        if status_filtro:
            query = query.filter(ContaPagarModel.status == status_filtro.value)

        total = query.with_entities(func.count(ContaPagarModel.id)).scalar() or 0

        rows = (
            query.order_by(ContaPagarModel.data_vencimento.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return [_to_dict_com_obra(conta, obra_nome) for conta, obra_nome in rows], total

    def get_by_id(self, empresa_id: UUID, conta_id: UUID) -> ContaPagar | None:
        model = (
            self.db.query(ContaPagarModel)
            .filter(ContaPagarModel.empresa_id == empresa_id, ContaPagarModel.id == conta_id)
            .first()
        )
        return _to_entity(model) if model else None

    def create(self, conta: ContaPagar) -> ContaPagar:
        model = ContaPagarModel(
            id=conta.id,
            empresa_id=conta.empresa_id,
            descricao=conta.descricao,
            valor=conta.valor,
            data_vencimento=conta.data_vencimento,
            fornecedor=conta.fornecedor,
            obra_id=conta.obra_id,
            categoria=conta.categoria,
            data_pagamento=conta.data_pagamento,
            status=conta.status.value,
            observacoes=conta.observacoes,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def update(self, conta: ContaPagar) -> ContaPagar:
        model = (
            self.db.query(ContaPagarModel)
            .filter(ContaPagarModel.empresa_id == conta.empresa_id, ContaPagarModel.id == conta.id)
            .first()
        )
        if model is None:
            raise ValueError("Conta a pagar não encontrada")

        model.descricao = conta.descricao
        model.valor = conta.valor
        model.data_vencimento = conta.data_vencimento
        model.fornecedor = conta.fornecedor
        model.obra_id = conta.obra_id
        model.categoria = conta.categoria
        model.data_pagamento = conta.data_pagamento
        model.status = conta.status.value
        model.observacoes = conta.observacoes

        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def delete(self, empresa_id: UUID, conta_id: UUID) -> bool:
        model = (
            self.db.query(ContaPagarModel)
            .filter(ContaPagarModel.empresa_id == empresa_id, ContaPagarModel.id == conta_id)
            .first()
        )
        if model is None:
            return False
        model.deletado_em = datetime.utcnow()
        self.db.commit()
        return True

    def total_pendente(self, empresa_id: UUID) -> float:
        total = (
            self.db.query(func.coalesce(func.sum(ContaPagarModel.valor), 0))
            .filter(
                ContaPagarModel.empresa_id == empresa_id,
                ContaPagarModel.status == StatusConta.PENDENTE.value,
            )
            .scalar()
        )
        return _to_float(total) or 0.0

    def fluxo_mensal(self, empresa_id: UUID, meses: list[str]) -> dict[str, float]:
        mes_expr = func.to_char(ContaPagarModel.data_pagamento, "YYYY-MM")
        rows = (
            self.db.query(mes_expr.label("mes"), func.coalesce(func.sum(ContaPagarModel.valor), 0))
            .filter(
                ContaPagarModel.empresa_id == empresa_id,
                ContaPagarModel.status == StatusConta.LIQUIDADO.value,
                mes_expr.in_(meses),
            )
            .group_by(mes_expr)
            .all()
        )
        return {mes: _to_float(valor) or 0.0 for mes, valor in rows}
