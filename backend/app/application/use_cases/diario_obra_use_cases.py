"""
Casos de uso do módulo Diário de Obra. Camada: Application.
"""
from __future__ import annotations
import uuid
from dataclasses import replace
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status

from app.domain.entities.diario_obra import MAX_FOTOS_POR_REGISTRO, ClimaObra, RegistroDiario
from app.domain.repositories.diario_obra_repository import DiarioObraRepository
from app.domain.repositories.obra_repository import ObraRepository


class DiarioObraUseCases:
    def __init__(self, repository: DiarioObraRepository, obra_repository: ObraRepository):
        self.repository = repository
        self.obra_repository = obra_repository

    def _validar_obra(self, empresa_id: UUID, obra_id: UUID) -> None:
        if self.obra_repository.get_by_id(empresa_id, obra_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Obra informada não foi encontrada nesta empresa.",
            )

    @staticmethod
    def _validar_fotos(fotos: list[str]) -> None:
        if len(fotos) > MAX_FOTOS_POR_REGISTRO:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"No máximo {MAX_FOTOS_POR_REGISTRO} fotos por registro.",
            )

    def listar(
        self, empresa_id: UUID, obra_id: UUID | None, page: int, page_size: int
    ) -> tuple[list[dict], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.repository.list_with_obra_nome(empresa_id, obra_id, page, page_size)

    def obter(self, empresa_id: UUID, registro_id: UUID) -> RegistroDiario:
        registro = self.repository.get_by_id(empresa_id, registro_id)
        if registro is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de diário não encontrado.")
        return registro

    def criar(
        self,
        empresa_id: UUID,
        obra_id: UUID,
        data_registro: date,
        observacoes: str,
        clima: ClimaObra | None,
        fotos: list[str],
    ) -> RegistroDiario:
        self._validar_obra(empresa_id, obra_id)
        self._validar_fotos(fotos)

        registro = RegistroDiario(
            id=uuid.uuid4(),
            empresa_id=empresa_id,
            obra_id=obra_id,
            data=data_registro,
            observacoes=observacoes.strip(),
            clima=clima,
            fotos=fotos,
        )
        return self.repository.create(registro)

    def atualizar(
        self,
        empresa_id: UUID,
        registro_id: UUID,
        obra_id: UUID,
        data_registro: date,
        observacoes: str,
        clima: ClimaObra | None,
        fotos: list[str],
    ) -> RegistroDiario:
        existente = self.obter(empresa_id, registro_id)
        self._validar_obra(empresa_id, obra_id)
        self._validar_fotos(fotos)

        atualizado = replace(
            existente,
            obra_id=obra_id,
            data=data_registro,
            observacoes=observacoes.strip(),
            clima=clima,
            fotos=fotos,
        )
        return self.repository.update(atualizado)

    def remover(self, empresa_id: UUID, registro_id: UUID) -> None:
        removido = self.repository.delete(empresa_id, registro_id)
        if not removido:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de diário não encontrado.")
