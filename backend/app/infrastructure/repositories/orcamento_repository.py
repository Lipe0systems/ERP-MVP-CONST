"""
Implementação SQLAlchemy do OrcamentoRepository.
Camada: Infrastructure.
"""
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domain.entities.orcamento import Orcamento, OrcamentoItem, StatusOrcamento
from app.domain.repositories.orcamento_repository import OrcamentoRepository
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.models.orcamento import OrcamentoItemModel, OrcamentoModel


def _to_float(value) -> float | None:
    return float(value) if value is not None else None


def _item_to_entity(model: OrcamentoItemModel) -> OrcamentoItem:
    return OrcamentoItem(
        id=model.id,
        orcamento_id=model.orcamento_id,
        descricao=model.descricao,
        quantidade=_to_float(model.quantidade),
        valor_unitario=_to_float(model.valor_unitario),
        unidade=model.unidade,
        estoque_id=model.estoque_id,
    )


def _to_entity(model: OrcamentoModel) -> Orcamento:
    return Orcamento(
        id=model.id,
        empresa_id=model.empresa_id,
        cliente_id=model.cliente_id,
        numero=model.numero,
        status=StatusOrcamento(model.status),
        obra_id=model.obra_id,
        validade=model.validade,
        observacoes=model.observacoes,
        conta_receber_id=model.conta_receber_id,
        itens=[_item_to_entity(i) for i in model.itens],
        criado_em=model.criado_em,
    )


class SqlAlchemyOrcamentoRepository(OrcamentoRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_with_relacionamentos(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: StatusOrcamento | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        query = (
            self.db.query(OrcamentoModel, ClienteModel.nome, ObraModel.nome)
            .join(ClienteModel, ClienteModel.id == OrcamentoModel.cliente_id)
            .outerjoin(ObraModel, ObraModel.id == OrcamentoModel.obra_id)
            .filter(OrcamentoModel.empresa_id == empresa_id)
        )

        if search:
            termo = f"%{search.strip()}%"
            query = query.filter(ClienteModel.nome.ilike(termo))
        if status_filtro:
            query = query.filter(OrcamentoModel.status == status_filtro.value)

        total = query.with_entities(func.count(OrcamentoModel.id)).scalar() or 0

        rows = (
            query.order_by(OrcamentoModel.numero.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        items = []
        for orc_model, cliente_nome, obra_nome in rows:
            itens_entity = [_item_to_entity(i) for i in orc_model.itens]
            valor_total = round(sum(i.valor_total for i in itens_entity), 2)
            items.append({
                "id": orc_model.id,
                "numero": orc_model.numero,
                "cliente_id": orc_model.cliente_id,
                "cliente_nome": cliente_nome,
                "obra_id": orc_model.obra_id,
                "obra_nome": obra_nome,
                "status": orc_model.status,
                "validade": orc_model.validade,
                "valor_total": valor_total,
                "qtd_itens": len(itens_entity),
                "conta_receber_id": orc_model.conta_receber_id,
                "observacoes": orc_model.observacoes,
                "criado_em": orc_model.criado_em,
            })

        return items, total

    def get_by_id(self, empresa_id: UUID, orcamento_id: UUID) -> Orcamento | None:
        model = (
            self.db.query(OrcamentoModel)
            .filter(
                OrcamentoModel.empresa_id == empresa_id,
                OrcamentoModel.id == orcamento_id,
            )
            .first()
        )
        return _to_entity(model) if model else None

    def next_numero(self, empresa_id: UUID) -> int:
        ultimo = (
            self.db.query(func.max(OrcamentoModel.numero))
            .filter(OrcamentoModel.empresa_id == empresa_id)
            .scalar()
        )
        return (ultimo or 0) + 1

    def create(self, orcamento: Orcamento) -> Orcamento:
        model = OrcamentoModel(
            id=orcamento.id,
            empresa_id=orcamento.empresa_id,
            numero=orcamento.numero,
            cliente_id=orcamento.cliente_id,
            obra_id=orcamento.obra_id,
            status=orcamento.status.value,
            validade=orcamento.validade,
            observacoes=orcamento.observacoes,
            conta_receber_id=orcamento.conta_receber_id,
            itens=[
                OrcamentoItemModel(
                    id=item.id,
                    orcamento_id=orcamento.id,
                    descricao=item.descricao,
                    quantidade=item.quantidade,
                    unidade=item.unidade,
                    valor_unitario=item.valor_unitario,
                    estoque_id=item.estoque_id,
                )
                for item in orcamento.itens
            ],
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def update(self, orcamento: Orcamento) -> Orcamento:
        model = (
            self.db.query(OrcamentoModel)
            .filter(
                OrcamentoModel.empresa_id == orcamento.empresa_id,
                OrcamentoModel.id == orcamento.id,
            )
            .first()
        )
        if model is None:
            raise ValueError("Orçamento não encontrado")

        model.cliente_id = orcamento.cliente_id
        model.obra_id = orcamento.obra_id
        model.status = orcamento.status.value
        model.validade = orcamento.validade
        model.observacoes = orcamento.observacoes
        model.conta_receber_id = orcamento.conta_receber_id

        # Substitui itens: deleta os antigos e insere os novos (mais simples
        # e seguro do que diff parcial, e sem risco de itens órfãos)
        for item_model in model.itens:
            self.db.delete(item_model)
        self.db.flush()

        model.itens = [
            OrcamentoItemModel(
                id=item.id,
                orcamento_id=orcamento.id,
                descricao=item.descricao,
                quantidade=item.quantidade,
                unidade=item.unidade,
                valor_unitario=item.valor_unitario,
                estoque_id=item.estoque_id,
            )
            for item in orcamento.itens
        ]

        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def delete(self, empresa_id: UUID, orcamento_id: UUID) -> bool:
        model = (
            self.db.query(OrcamentoModel)
            .filter(
                OrcamentoModel.empresa_id == empresa_id,
                OrcamentoModel.id == orcamento_id,
            )
            .first()
        )
        if model is None:
            return False
        self.db.delete(model)  # cascade deleta os itens
        self.db.commit()
        return True
