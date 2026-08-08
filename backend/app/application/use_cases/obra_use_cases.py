"""
Casos de uso do módulo Obras: orquestram regras de negócio e delegam
persistência ao repositório. Camada: Application.
"""
from __future__ import annotations
import uuid
from dataclasses import replace
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.obra import Obra, ObraStatus
from app.domain.exceptions import DependencyExistsError
from app.domain.repositories.cliente_repository import ClienteRepository
from app.domain.repositories.obra_repository import ObraRepository


class ObraUseCases:
    def __init__(self, obra_repository: ObraRepository, cliente_repository: ClienteRepository):
        self.obra_repository = obra_repository
        self.cliente_repository = cliente_repository

    def _validar_cliente(self, empresa_id: UUID, cliente_id: UUID) -> None:
        if self.cliente_repository.get_by_id(empresa_id, cliente_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente informado não foi encontrado nesta empresa.",
            )

    @staticmethod
    def _validar_datas(data_inicio: date | None, data_previsao: date | None) -> None:
        if data_inicio and data_previsao and data_previsao < data_inicio:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A data de previsão não pode ser anterior à data de início.",
            )

    def listar(
        self,
        empresa_id: UUID,
        search: str | None,
        status_filtro: ObraStatus | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.obra_repository.list_with_cliente(empresa_id, search, status_filtro, page, page_size)

    def obter(self, empresa_id: UUID, obra_id: UUID) -> Obra:
        obra = self.obra_repository.get_by_id(empresa_id, obra_id)
        if obra is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra não encontrada.")
        return obra

    def criar(
        self,
        empresa_id: UUID,
        nome: str,
        cliente_id: UUID,
        endereco: str | None,
        responsavel: str | None,
        data_inicio: date | None,
        data_previsao: date | None,
        status_obra: ObraStatus,
        valor_previsto: float | None,
        valor_realizado: float | None,
    ) -> Obra:
        self._validar_cliente(empresa_id, cliente_id)
        self._validar_datas(data_inicio, data_previsao)

        obra = Obra(
            id=uuid.uuid4(),
            empresa_id=empresa_id,
            nome=nome.strip(),
            cliente_id=cliente_id,
            endereco=endereco,
            responsavel=responsavel,
            data_inicio=data_inicio,
            data_previsao=data_previsao,
            status=status_obra,
            valor_previsto=valor_previsto,
            valor_realizado=valor_realizado,
        )
        return self.obra_repository.create(obra)

    def atualizar(
        self,
        empresa_id: UUID,
        obra_id: UUID,
        nome: str,
        cliente_id: UUID,
        endereco: str | None,
        responsavel: str | None,
        data_inicio: date | None,
        data_previsao: date | None,
        status_obra: ObraStatus,
        valor_previsto: float | None,
        valor_realizado: float | None,
    ) -> Obra:
        existente = self.obter(empresa_id, obra_id)
        self._validar_cliente(empresa_id, cliente_id)
        self._validar_datas(data_inicio, data_previsao)

        atualizada = replace(
            existente,
            nome=nome.strip(),
            cliente_id=cliente_id,
            endereco=endereco,
            responsavel=responsavel,
            data_inicio=data_inicio,
            data_previsao=data_previsao,
            status=status_obra,
            valor_previsto=valor_previsto,
            valor_realizado=valor_realizado,
        )
        return self.obra_repository.update(atualizada)

    def remover(self, empresa_id: UUID, obra_id: UUID) -> None:
        try:
            removida = self.obra_repository.delete(empresa_id, obra_id)
        except DependencyExistsError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
        if not removida:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra não encontrada.")
