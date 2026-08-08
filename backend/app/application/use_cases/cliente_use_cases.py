"""
Casos de uso do módulo Clientes: orquestram regras de negócio e delegam
persistência ao repositório. Camada: Application.
"""
from __future__ import annotations
import uuid
from dataclasses import replace
from uuid import UUID

from fastapi import HTTPException, status

from app.core.validators import is_valid_cpf_cnpj, only_digits
from app.domain.entities.cliente import Cliente
from app.domain.exceptions import DependencyExistsError
from app.domain.repositories.cliente_repository import ClienteRepository


class ClienteUseCases:
    def __init__(self, repository: ClienteRepository):
        self.repository = repository

    @staticmethod
    def _validar_documento(documento: str) -> str:
        digits = only_digits(documento)
        if not is_valid_cpf_cnpj(digits):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="CPF/CNPJ inválido.",
            )
        return digits

    def listar(
        self, empresa_id: UUID, search: str | None, page: int, page_size: int
    ) -> tuple[list[Cliente], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.repository.list(empresa_id, search, page, page_size)

    def obter(self, empresa_id: UUID, cliente_id: UUID) -> Cliente:
        cliente = self.repository.get_by_id(empresa_id, cliente_id)
        if cliente is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
        return cliente

    def criar(
        self,
        empresa_id: UUID,
        nome: str,
        documento: str,
        email: str | None,
        telefone: str | None,
        whatsapp: str | None,
        rg: str | None,
        sexo: str | None,
        data_nascimento,
        cep: str | None,
        logradouro: str | None,
        numero: str | None,
        complemento: str | None,
        bairro: str | None,
        cidade: str | None,
        estado: str | None,
        endereco: str | None,
        observacoes: str | None,
    ) -> Cliente:
        documento_normalizado = self._validar_documento(documento)

        if self.repository.get_by_documento(empresa_id, documento_normalizado):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um cliente cadastrado com este CPF/CNPJ.",
            )

        cliente = Cliente(
            id=uuid.uuid4(),
            empresa_id=empresa_id,
            nome=nome.strip(),
            documento=documento_normalizado,
            email=email,
            telefone=telefone,
            whatsapp=whatsapp,
            rg=rg,
            sexo=sexo,
            data_nascimento=data_nascimento,
            cep=cep,
            logradouro=logradouro,
            numero=numero,
            complemento=complemento,
            bairro=bairro,
            cidade=cidade,
            estado=estado,
            endereco=endereco,
            observacoes=observacoes,
        )
        return self.repository.create(cliente)

    def atualizar(
        self,
        empresa_id: UUID,
        cliente_id: UUID,
        nome: str,
        documento: str,
        email: str | None,
        telefone: str | None,
        whatsapp: str | None,
        rg: str | None,
        sexo: str | None,
        data_nascimento,
        cep: str | None,
        logradouro: str | None,
        numero: str | None,
        complemento: str | None,
        bairro: str | None,
        cidade: str | None,
        estado: str | None,
        endereco: str | None,
        observacoes: str | None,
    ) -> Cliente:
        existente = self.obter(empresa_id, cliente_id)
        documento_normalizado = self._validar_documento(documento)

        if documento_normalizado != existente.documento:
            duplicado = self.repository.get_by_documento(empresa_id, documento_normalizado)
            if duplicado and duplicado.id != cliente_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Já existe um cliente cadastrado com este CPF/CNPJ.",
                )

        atualizado = replace(
            existente,
            nome=nome.strip(),
            documento=documento_normalizado,
            email=email,
            telefone=telefone,
            whatsapp=whatsapp,
            rg=rg,
            sexo=sexo,
            data_nascimento=data_nascimento,
            cep=cep,
            logradouro=logradouro,
            numero=numero,
            complemento=complemento,
            bairro=bairro,
            cidade=cidade,
            estado=estado,
            endereco=endereco,
            observacoes=observacoes,
        )
        return self.repository.update(atualizado)

    def remover(self, empresa_id: UUID, cliente_id: UUID) -> None:
        try:
            removido = self.repository.delete(empresa_id, cliente_id)
        except DependencyExistsError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
        if not removido:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")

    def contar(self, empresa_id: UUID) -> int:
        return self.repository.contar(empresa_id)
