"""
Implementação SQLAlchemy do ObraRepository.
Camada: Infrastructure.
"""
from __future__ import annotations
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.entities.obra import Obra, ObraStatus
from app.domain.exceptions import DependencyExistsError
from app.domain.repositories.obra_repository import ObraRepository
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.obra import ObraModel
from datetime import datetime


def _to_float(value) -> float | None:
    return float(value) if value is not None else None


def _to_entity(model: ObraModel) -> Obra:
    return Obra(
        id=model.id,
        empresa_id=model.empresa_id,
        nome=model.nome,
        cliente_id=model.cliente_id,
        endereco=model.endereco,
        responsavel=model.responsavel,
        data_inicio=model.data_inicio,
        data_previsao=model.data_previsao,
        status=ObraStatus(model.status),
        valor_previsto=_to_float(model.valor_previsto),
        valor_realizado=_to_float(model.valor_realizado),
        criado_em=model.criado_em,
    )


def _to_dict_com_cliente(model: ObraModel, cliente_nome: str) -> dict:
    return {
        "id": model.id,
        "nome": model.nome,
        "cliente_id": model.cliente_id,
        "cliente_nome": cliente_nome,
        "endereco": model.endereco,
        "responsavel": model.responsavel,
        "data_inicio": model.data_inicio,
        "data_previsao": model.data_previsao,
        "status": model.status,
        "valor_previsto": _to_float(model.valor_previsto),
        "valor_realizado": _to_float(model.valor_realizado),
        "criado_em": model.criado_em,
    }


class SqlAlchemyObraRepository(ObraRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_with_cliente(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: ObraStatus | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        query = (
            self.db.query(ObraModel, ClienteModel.nome)
            .join(ClienteModel, ClienteModel.id == ObraModel.cliente_id)
            .filter(ObraModel.empresa_id == empresa_id)
        )

        if search:
            termo = f"%{search.strip()}%"
            query = query.filter(or_(ObraModel.nome.ilike(termo), ClienteModel.nome.ilike(termo)))

        if status_filtro:
            query = query.filter(ObraModel.status == status_filtro.value)

        total = query.with_entities(func.count(ObraModel.id)).scalar() or 0

        rows = (
            query.order_by(ObraModel.criado_em.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return [_to_dict_com_cliente(obra, cliente_nome) for obra, cliente_nome in rows], total

    def get_by_id(self, empresa_id: UUID, obra_id: UUID) -> Obra | None:
        model = (
            self.db.query(ObraModel)
            .filter(ObraModel.empresa_id == empresa_id, ObraModel.id == obra_id)
            .first()
        )
        return _to_entity(model) if model else None

    def create(self, obra: Obra) -> Obra:
        model = ObraModel(
            id=obra.id,
            empresa_id=obra.empresa_id,
            nome=obra.nome,
            cliente_id=obra.cliente_id,
            endereco=obra.endereco,
            responsavel=obra.responsavel,
            data_inicio=obra.data_inicio,
            data_previsao=obra.data_previsao,
            status=obra.status.value,
            valor_previsto=obra.valor_previsto,
            valor_realizado=obra.valor_realizado,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def update(self, obra: Obra) -> Obra:
        model = (
            self.db.query(ObraModel)
            .filter(ObraModel.empresa_id == obra.empresa_id, ObraModel.id == obra.id)
            .first()
        )
        if model is None:
            raise ValueError("Obra não encontrada")

        model.nome = obra.nome
        model.cliente_id = obra.cliente_id
        model.endereco = obra.endereco
        model.responsavel = obra.responsavel
        model.data_inicio = obra.data_inicio
        model.data_previsao = obra.data_previsao
        model.status = obra.status.value
        model.valor_previsto = obra.valor_previsto
        model.valor_realizado = obra.valor_realizado

        self.db.commit()
        self.db.refresh(model)
        return _to_entity(model)

    def delete(self, empresa_id: UUID, obra_id: UUID) -> bool:
        model = (
            self.db.query(ObraModel)
            .filter(ObraModel.empresa_id == empresa_id, ObraModel.id == obra_id)
            .first()
        )
        if model is None:
            return False
        try:
            model.deletado_em = datetime.utcnow()
            self.db.commit()
        except IntegrityError as exc:
            # Ocorre quando a obra possui registros dependentes (ex.: contas
            # a pagar/receber) com FK RESTRICT — traduzimos para uma exceção
            # de domínio em vez de deixar o IntegrityError vazar como 500.
            self.db.rollback()
            raise DependencyExistsError(
                "Obra possui registros vinculados (ex.: contas a pagar/receber) e não pode ser removida."
            ) from exc
        return True

    def contar_ativas_e_concluidas(self, empresa_id: UUID) -> tuple[int, int]:
        concluidas_status = ObraStatus.CONCLUIDA.value
        cancelada_status = ObraStatus.CANCELADA.value

        ativas = (
            self.db.query(func.count(ObraModel.id))
            .filter(
                ObraModel.empresa_id == empresa_id,
                ObraModel.status.notin_([concluidas_status, cancelada_status]),
            )
            .scalar()
            or 0
        )
        concluidas = (
            self.db.query(func.count(ObraModel.id))
            .filter(ObraModel.empresa_id == empresa_id, ObraModel.status == concluidas_status)
            .scalar()
            or 0
        )
        return ativas, concluidas
