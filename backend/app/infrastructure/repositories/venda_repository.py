from __future__ import annotations
"""Implementação SQLAlchemy do VendaRepository. Camada: Infrastructure."""
from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domain.entities.venda import FormaPagamento, ParcelaVenda, StatusVenda, Venda
from app.domain.repositories.venda_repository import VendaRepository
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.models.venda import ParcelaVendaModel, VendaModel


def _parcela_to_entity(m: ParcelaVendaModel) -> ParcelaVenda:
    return ParcelaVenda(
        id=m.id, venda_id=m.venda_id, empresa_id=m.empresa_id,
        numero=m.numero, valor=float(m.valor), vencimento=m.vencimento,
        conta_receber_id=m.conta_receber_id, criado_em=m.criado_em,
    )


def _to_entity(m: VendaModel) -> Venda:
    return Venda(
        id=m.id, empresa_id=m.empresa_id, numero=m.numero,
        cliente_id=m.cliente_id, orcamento_id=m.orcamento_id, obra_id=m.obra_id,
        status=StatusVenda(m.status), forma_pagamento=FormaPagamento(m.forma_pagamento),
        valor_total=float(m.valor_total), desconto=float(m.desconto or 0),
        observacoes=m.observacoes,
        parcelas=[_parcela_to_entity(p) for p in m.parcelas],
        criado_em=m.criado_em,
    )


class SqlAlchemyVendaRepository(VendaRepository):
    def __init__(self, db: Session): self.db = db

    def list(self, empresa_id: UUID, status: StatusVenda | None, page: int, page_size: int) -> tuple[list[dict], int]:
        q = (
            self.db.query(VendaModel, ClienteModel.nome, ObraModel.nome)
            .join(ClienteModel, ClienteModel.id == VendaModel.cliente_id)
            .outerjoin(ObraModel, ObraModel.id == VendaModel.obra_id)
            .filter(VendaModel.empresa_id == empresa_id)
        )
        if status: q = q.filter(VendaModel.status == status.value)
        total = q.with_entities(func.count(VendaModel.id)).scalar() or 0
        rows = q.order_by(VendaModel.numero.desc()).offset((page - 1) * page_size).limit(page_size).all()

        items = []
        for v, cliente_nome, obra_nome in rows:
            items.append({
                "id": v.id, "numero": v.numero, "empresa_id": v.empresa_id,
                "cliente_id": v.cliente_id, "cliente_nome": cliente_nome,
                "orcamento_id": v.orcamento_id, "obra_id": v.obra_id, "obra_nome": obra_nome,
                "status": v.status, "forma_pagamento": v.forma_pagamento,
                "valor_total": float(v.valor_total), "desconto": float(v.desconto or 0),
                "valor_liquido": round(float(v.valor_total) - float(v.desconto or 0), 2),
                "num_parcelas": len(v.parcelas),
                "observacoes": v.observacoes, "criado_em": v.criado_em,
            })
        return items, total

    def get_by_id(self, empresa_id: UUID, venda_id: UUID) -> Venda | None:
        m = self.db.query(VendaModel).filter(
            VendaModel.empresa_id == empresa_id, VendaModel.id == venda_id,
        ).first()
        return _to_entity(m) if m else None

    def next_numero(self, empresa_id: UUID) -> int:
        ultimo = self.db.query(func.max(VendaModel.numero)).filter(VendaModel.empresa_id == empresa_id).scalar()
        return (ultimo or 0) + 1

    def create(self, venda: Venda) -> Venda:
        m = VendaModel(
            id=venda.id, empresa_id=venda.empresa_id, numero=venda.numero,
            cliente_id=venda.cliente_id, orcamento_id=venda.orcamento_id,
            obra_id=venda.obra_id, status=venda.status.value,
            forma_pagamento=venda.forma_pagamento.value,
            valor_total=venda.valor_total, desconto=venda.desconto,
            observacoes=venda.observacoes,
            parcelas=[
                ParcelaVendaModel(
                    id=p.id, venda_id=venda.id, empresa_id=venda.empresa_id,
                    numero=p.numero, valor=p.valor, vencimento=p.vencimento,
                    conta_receber_id=p.conta_receber_id,
                )
                for p in venda.parcelas
            ],
        )
        self.db.add(m); self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def update(self, venda: Venda) -> Venda:
        m = self.db.query(VendaModel).filter(
            VendaModel.empresa_id == venda.empresa_id, VendaModel.id == venda.id,
        ).first()
        if not m: raise ValueError("Venda não encontrada")
        m.status = venda.status.value
        m.observacoes = venda.observacoes
        self.db.commit(); self.db.refresh(m)
        return _to_entity(m)
