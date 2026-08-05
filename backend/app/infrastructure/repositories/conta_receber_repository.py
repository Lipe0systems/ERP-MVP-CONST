"""
Implementação SQLAlchemy do ContaReceberRepository.
Camada: Infrastructure.
"""
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.domain.entities.financeiro import ContaReceber, StatusConta
from app.domain.repositories.conta_receber_repository import ContaReceberRepository
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.conta_receber import ContaReceberModel
from app.infrastructure.database.models.obra import ObraModel


def _to_float(value) -> float | None:
    return float(value) if value is not None else None


def _to_entity(model: ContaReceberModel) -> ContaReceber:
    return ContaReceber(
        id=model.id,
        empresa_id=model.empresa_id,
        descricao=model.descricao,
        valor=_to_float(model.valor),
        data_vencimento=model.data_vencimento,
        cliente_id=model.cliente_id,
        obra_id=model.obra_id,
        data_recebimento=model.data_recebimento,
        status=StatusConta(model.status),
        observacoes=model.observacoes,
        criado_em=model.criado_em,
    )


def _to_dict_com_relacionamentos(
    model: ContaReceberModel, cliente_nome: str | None, obra_nome: str | None
) -> dict:
    return {
        "id": model.id,
        "descricao": model.descricao,
        "valor": _to_float(model.valor),
        "data_vencimento": model.data_vencimento,
        "cliente_id": model.cliente_id,
        "cliente_nome": cliente_nome,
        "obra_id": model.obra_id,
        "obra_nome": obra_nome,
        "data_recebimento": model.data_recebimento,
        "status": model.status,
        "observacoes": model.observacoes,
        "criado_em": model.criado_em,
    }


class SqlAlchemyContaReceberRepository(ContaReceberRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_with_relacionamentos(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: StatusConta | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        # LEFT JOIN (isouter=True) nos dois: cliente_id e obra_id são
        # opcionais, então uma conta sem vínculo não pode sumir do resultado.
        query = (
            self.db.query(ContaReceberModel, ClienteModel.nome, ObraModel.nome)
            .outerjoin(ClienteModel, ClienteModel.id == ContaReceberModel.cliente_id)
            .outerjoin(ObraModel, ObraModel.id == ContaReceberModel.obra_id)
            .filter(ContaReceberModel.empresa_id == empresa_id)
        )

        if search:
            termo = f"%{search.strip()}%"
            query = query.filter(ContaReceberModel.descricao.ilike(termo))
        if status_filtro:
            query = query.filter(ContaReceberModel.status == status_filtro.value)

        total = query.with_entities(func.count(ContaReceberModel.id)).scalar() or 0

        rows = (
            query.order_by(ContaReceberModel.data_vencimento.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return [
            _to_dict_com_relacionamentos(conta, cliente_nome, obra_nome)
            for conta, cliente_nome, obra_nome in rows
        ], total

    def get_by_id(self, empresa_id: UUID, conta_id: UUID) -> ContaReceber | None:
        model = (
            self.db.query(ContaReceberModel)
            .filter(ContaReceberModel.empresa_id == empresa_id, ContaReceberModel.id == conta_id)
            .first()
        )
        return _to_entity(model) if model else None

    def create(self, conta: ContaReceber) -> ContaReceber:
        model = ContaReceberModel(
            id=conta.id,
            empresa_id=conta.empresa_id,
            descricao=conta.descricao,
            valor=conta.valor,
            data_vencimento=conta.data_vencimento,
            cliente_id=conta.cliente_id,
            obra_id=conta.obra_id,
            data_recebimento=conta.data_recebimento,
            status=conta.status.value,
            observacoes=conta.observacoes,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def update(self, conta: ContaReceber) -> ContaReceber:
        model = (
            self.db.query(ContaReceberModel)
            .filter(ContaReceberModel.empresa_id == conta.empresa_id, ContaReceberModel.id == conta.id)
            .first()
        )
        if model is None:
            raise ValueError("Conta a receber não encontrada")

        model.descricao = conta.descricao
        model.valor = conta.valor
        model.data_vencimento = conta.data_vencimento
        model.cliente_id = conta.cliente_id
        model.obra_id = conta.obra_id
        model.data_recebimento = conta.data_recebimento
        model.status = conta.status.value
        model.observacoes = conta.observacoes

        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def delete(self, empresa_id: UUID, conta_id: UUID) -> bool:
        model = (
            self.db.query(ContaReceberModel)
            .filter(ContaReceberModel.empresa_id == empresa_id, ContaReceberModel.id == conta_id)
            .first()
        )
        if model is None:
            return False
        self.db.delete(model)
        self.db.commit()
        return True

    def total_pendente(self, empresa_id: UUID) -> float:
        total = (
            self.db.query(func.coalesce(func.sum(ContaReceberModel.valor), 0))
            .filter(
                ContaReceberModel.empresa_id == empresa_id,
                ContaReceberModel.status == StatusConta.PENDENTE.value,
            )
            .scalar()
        )
        return _to_float(total) or 0.0

    def fluxo_mensal(self, empresa_id: UUID, meses: list[str]) -> dict[str, float]:
        mes_expr = func.to_char(ContaReceberModel.data_recebimento, "YYYY-MM")
        rows = (
            self.db.query(mes_expr.label("mes"), func.coalesce(func.sum(ContaReceberModel.valor), 0))
            .filter(
                ContaReceberModel.empresa_id == empresa_id,
                ContaReceberModel.status == StatusConta.LIQUIDADO.value,
                mes_expr.in_(meses),
            )
            .group_by(mes_expr)
            .all()
        )
        return {mes: _to_float(valor) or 0.0 for mes, valor in rows}
