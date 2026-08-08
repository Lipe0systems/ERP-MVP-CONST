from __future__ import annotations
"""Casos de uso do módulo Atendimentos. Camada: Application."""
import uuid
from dataclasses import replace
from datetime import date, time
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.atendimento import Atendimento, StatusAtendimento, TipoAtendimento
from app.domain.repositories.atendimento_repository import AtendimentoRepository
from app.domain.repositories.cliente_repository import ClienteRepository
from app.domain.repositories.obra_repository import ObraRepository


class AtendimentoUseCases:
    def __init__(
        self,
        repository: AtendimentoRepository,
        cliente_repository: ClienteRepository,
        obra_repository: ObraRepository,
    ):
        self.repository = repository
        self.cliente_repo = cliente_repository
        self.obra_repo = obra_repository

    def _validar_cliente(self, empresa_id: UUID, cliente_id: UUID) -> None:
        if self.cliente_repo.get_by_id(empresa_id, cliente_id) is None:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    def _validar_obra(self, empresa_id: UUID, obra_id: UUID | None) -> None:
        if obra_id and self.obra_repo.get_by_id(empresa_id, obra_id) is None:
            raise HTTPException(status_code=404, detail="Obra não encontrada.")

    def listar(
        self, empresa_id: UUID, cliente_id: UUID | None,
        obra_id: UUID | None, status_filtro: StatusAtendimento | None,
        page: int, page_size: int,
    ) -> tuple[list[dict], int]:
        page = max(page, 1); page_size = min(max(page_size, 1), 100)
        return self.repository.list(empresa_id, cliente_id, obra_id, status_filtro, page, page_size)

    def obter(self, empresa_id: UUID, atendimento_id: UUID) -> Atendimento:
        a = self.repository.get_by_id(empresa_id, atendimento_id)
        if not a:
            raise HTTPException(status_code=404, detail="Atendimento não encontrado.")
        return a

    def criar(
        self,
        empresa_id: UUID,
        cliente_id: UUID,
        obra_id: UUID | None,
        tipo: TipoAtendimento,
        status_val: StatusAtendimento,
        data: date,
        hora: time | None,
        responsavel: str | None,
        descricao: str | None,
        checklist: list[str],
        observacoes: str | None,
    ) -> Atendimento:
        self._validar_cliente(empresa_id, cliente_id)
        self._validar_obra(empresa_id, obra_id)
        a = Atendimento(
            id=uuid.uuid4(), empresa_id=empresa_id,
            cliente_id=cliente_id, obra_id=obra_id,
            tipo=tipo, status=status_val,
            data=data, hora=hora, responsavel=responsavel,
            descricao=descricao, checklist=checklist,
            observacoes=observacoes,
        )
        return self.repository.create(a)

    def atualizar(
        self, empresa_id: UUID, atendimento_id: UUID,
        cliente_id: UUID, obra_id: UUID | None,
        tipo: TipoAtendimento, status_val: StatusAtendimento,
        data: date, hora: time | None, responsavel: str | None,
        descricao: str | None, checklist: list[str],
        checklist_ok: list[str], fotos: list[str],
        assinatura_url: str | None, observacoes: str | None,
    ) -> Atendimento:
        existente = self.obter(empresa_id, atendimento_id)
        self._validar_cliente(empresa_id, cliente_id)
        self._validar_obra(empresa_id, obra_id)
        atualizado = replace(
            existente,
            cliente_id=cliente_id, obra_id=obra_id,
            tipo=tipo, status=status_val,
            data=data, hora=hora, responsavel=responsavel,
            descricao=descricao, checklist=checklist,
            checklist_ok=checklist_ok, fotos=fotos,
            assinatura_url=assinatura_url, observacoes=observacoes,
        )
        return self.repository.update(atualizado)

    def remover(self, empresa_id: UUID, atendimento_id: UUID) -> None:
        if not self.repository.delete(empresa_id, atendimento_id):
            raise HTTPException(status_code=404, detail="Atendimento não encontrado.")
