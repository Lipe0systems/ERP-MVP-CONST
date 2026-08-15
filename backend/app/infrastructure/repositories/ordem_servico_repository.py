"""Implementação SQLAlchemy do repositório de Ordem de Serviço. Camada: Infrastructure."""
from __future__ import annotations
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domain.entities.ordem_servico import OrdemServico, StatusOrdemServico
from app.infrastructure.database.models.ordem_servico import OrdemServicoModel
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.models.usuario import UsuarioModel
from app.infrastructure.database.soft_delete import soft_delete


def _to_entity(m: OrdemServicoModel) -> OrdemServico:
    return OrdemServico(
        id=m.id, empresa_id=m.empresa_id, numero=m.numero,
        titulo=m.titulo, descricao=m.descricao,
        cliente_id=m.cliente_id, obra_id=m.obra_id, instalador_id=m.instalador_id,
        status=StatusOrdemServico(m.status), endereco=m.endereco,
        data_agendada=m.data_agendada,
        foto_conclusao_url=m.foto_conclusao_url,
        observacoes_conclusao=m.observacoes_conclusao,
        concluido_em=m.concluido_em, criado_em=m.criado_em,
    )


class SqlAlchemyOrdemServicoRepository:
    def __init__(self, db: Session): self.db = db

    def next_numero(self, empresa_id: UUID) -> int:
        ultimo = (
            self.db.query(func.max(OrdemServicoModel.numero))
            .filter(OrdemServicoModel.empresa_id == empresa_id)
            .scalar()
        )
        return (ultimo or 0) + 1

    def list(
        self, empresa_id: UUID,
        *, instalador_id: UUID | None = None, status: StatusOrdemServico | None = None,
        page: int = 1, page_size: int = 20,
    ) -> tuple[list[dict], int]:
        """
        instalador_id: quando informado, restringe SOMENTE às ordens
        atribuídas a esse instalador — é o filtro que garante que um
        usuário com papel "instalador" só veja o que é dele (a checagem de
        que ele não pode ver de outros nunca chega a acontecer no banco
        porque o endpoint sempre passa o próprio id nesse caso).
        """
        q = (
            self.db.query(
                OrdemServicoModel,
                ClienteModel.nome, ObraModel.nome, UsuarioModel.nome,
            )
            .outerjoin(ClienteModel, ClienteModel.id == OrdemServicoModel.cliente_id)
            .outerjoin(ObraModel, ObraModel.id == OrdemServicoModel.obra_id)
            .outerjoin(UsuarioModel, UsuarioModel.id == OrdemServicoModel.instalador_id)
            .filter(OrdemServicoModel.empresa_id == empresa_id)
        )
        if instalador_id:
            q = q.filter(OrdemServicoModel.instalador_id == instalador_id)
        if status:
            q = q.filter(OrdemServicoModel.status == status.value)

        total = q.with_entities(func.count(OrdemServicoModel.id)).scalar() or 0
        rows = (
            q.order_by(OrdemServicoModel.numero.desc())
            .offset((page - 1) * page_size).limit(page_size).all()
        )

        items = []
        for os_, cliente_nome, obra_nome, instalador_nome in rows:
            items.append({
                "id": os_.id, "numero": os_.numero, "titulo": os_.titulo,
                "descricao": os_.descricao,
                "cliente_id": os_.cliente_id, "cliente_nome": cliente_nome,
                "obra_id": os_.obra_id, "obra_nome": obra_nome,
                "instalador_id": os_.instalador_id, "instalador_nome": instalador_nome,
                "status": os_.status, "endereco": os_.endereco,
                "data_agendada": os_.data_agendada,
                "foto_conclusao_url": os_.foto_conclusao_url,
                "concluido_em": os_.concluido_em,
                "criado_em": os_.criado_em,
            })
        return items, total

    def get_by_id(self, empresa_id: UUID, ordem_id: UUID) -> OrdemServico | None:
        m = self.db.query(OrdemServicoModel).filter(
            OrdemServicoModel.empresa_id == empresa_id,
            OrdemServicoModel.id == ordem_id,
        ).first()
        return _to_entity(m) if m else None

    def get_by_id_com_nomes(self, empresa_id: UUID, ordem_id: UUID) -> dict | None:
        """Mesma ideia de list(), mas para 1 registro só — usado nos retornos
        de criar/atualizar/concluir/obter, para não precisar listar tudo e
        procurar em Python (o que quebraria silenciosamente acima de 1000
        ordens numa mesma empresa)."""
        row = (
            self.db.query(
                OrdemServicoModel,
                ClienteModel.nome, ObraModel.nome, UsuarioModel.nome,
            )
            .outerjoin(ClienteModel, ClienteModel.id == OrdemServicoModel.cliente_id)
            .outerjoin(ObraModel, ObraModel.id == OrdemServicoModel.obra_id)
            .outerjoin(UsuarioModel, UsuarioModel.id == OrdemServicoModel.instalador_id)
            .filter(
                OrdemServicoModel.empresa_id == empresa_id,
                OrdemServicoModel.id == ordem_id,
            )
            .first()
        )
        if not row:
            return None
        os_, cliente_nome, obra_nome, instalador_nome = row
        return {
            "id": os_.id, "numero": os_.numero, "titulo": os_.titulo,
            "descricao": os_.descricao,
            "cliente_id": os_.cliente_id, "cliente_nome": cliente_nome,
            "obra_id": os_.obra_id, "obra_nome": obra_nome,
            "instalador_id": os_.instalador_id, "instalador_nome": instalador_nome,
            "status": os_.status, "endereco": os_.endereco,
            "data_agendada": os_.data_agendada,
            "foto_conclusao_url": os_.foto_conclusao_url,
            "concluido_em": os_.concluido_em,
            "criado_em": os_.criado_em,
        }

    def create(self, os_: OrdemServico) -> OrdemServico:
        m = OrdemServicoModel(
            id=os_.id, empresa_id=os_.empresa_id, numero=os_.numero,
            titulo=os_.titulo, descricao=os_.descricao,
            cliente_id=os_.cliente_id, obra_id=os_.obra_id,
            instalador_id=os_.instalador_id, status=os_.status.value,
            endereco=os_.endereco, data_agendada=os_.data_agendada,
        )
        self.db.add(m); self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def update(self, os_: OrdemServico) -> OrdemServico:
        m = self.db.query(OrdemServicoModel).filter(
            OrdemServicoModel.empresa_id == os_.empresa_id,
            OrdemServicoModel.id == os_.id,
        ).first()
        if not m: raise ValueError("Ordem de serviço não encontrada")
        m.titulo = os_.titulo; m.descricao = os_.descricao
        m.cliente_id = os_.cliente_id; m.obra_id = os_.obra_id
        m.instalador_id = os_.instalador_id; m.status = os_.status.value
        m.endereco = os_.endereco; m.data_agendada = os_.data_agendada
        self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def marcar_concluida(
        self, empresa_id: UUID, ordem_id: UUID,
        *, foto_conclusao_url: str, observacoes: str | None,
    ) -> OrdemServico | None:
        from datetime import datetime
        m = self.db.query(OrdemServicoModel).filter(
            OrdemServicoModel.empresa_id == empresa_id,
            OrdemServicoModel.id == ordem_id,
        ).first()
        if not m: return None
        m.status = StatusOrdemServico.CONCLUIDA.value
        m.foto_conclusao_url = foto_conclusao_url
        m.observacoes_conclusao = observacoes
        m.concluido_em = datetime.utcnow()
        self.db.commit(); self.db.refresh(m)
        return _to_entity(m)

    def delete(self, empresa_id: UUID, ordem_id: UUID) -> bool:
        m = self.db.query(OrdemServicoModel).filter(
            OrdemServicoModel.empresa_id == empresa_id,
            OrdemServicoModel.id == ordem_id,
        ).first()
        if not m: return False
        soft_delete(self.db, m)
        return True
