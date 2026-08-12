"""Schemas do módulo RH: Funcionários, Alocações, Ponto. Camada: Presentation."""
from __future__ import annotations
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

TIPOS_CONTRATACAO = ("clt", "diarista", "empreiteiro", "pj")
STATUS_PONTO = ("presente", "falta", "meio_periodo", "atestado", "ferias", "folga")


# ── Funcionário ───────────────────────────────────────────────────────────────
class FuncionarioCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    cpf: str | None = Field(None, max_length=11)
    cargo: str | None = Field(None, max_length=120)
    salario: float = Field(default=0, ge=0)
    tipo_contratacao: str = Field(default="clt")
    data_admissao: date | None = None
    data_demissao: date | None = None
    telefone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    ativo: bool = True
    observacoes: str | None = None


class FuncionarioUpdate(FuncionarioCreate):
    pass


class FuncionarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    nome: str
    cpf: str | None
    cargo: str | None
    salario: float
    tipo_contratacao: str
    data_admissao: date | None
    data_demissao: date | None
    telefone: str | None
    email: str | None
    ativo: bool
    observacoes: str | None
    criado_em: datetime


# ── Alocação ──────────────────────────────────────────────────────────────────
class AlocacaoCreate(BaseModel):
    funcionario_id: UUID
    obra_id: UUID
    data_inicio: date
    data_fim: date | None = None
    funcao: str | None = Field(None, max_length=120)
    ativa: bool = True


class AlocacaoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    funcionario_id: UUID
    obra_id: UUID
    data_inicio: date
    data_fim: date | None
    funcao: str | None
    ativa: bool
    # Enriquecido:
    funcionario_nome: str | None = None
    obra_nome: str | None = None


# ── Ponto ─────────────────────────────────────────────────────────────────────
class PontoCreate(BaseModel):
    funcionario_id: UUID
    obra_id: UUID | None = None
    data: date
    status: str = Field(default="presente")
    horas: float | None = None
    observacoes: str | None = None


class PontoItemLote(BaseModel):
    """Item individual dentro de um registro de ponto em lote (a data vem do lote)."""
    funcionario_id: UUID
    obra_id: UUID | None = None
    status: str = Field(default="presente")
    horas: float | None = None
    observacoes: str | None = None


class PontoLoteCreate(BaseModel):
    """Registro de ponto em lote — vários funcionários no mesmo dia."""
    data: date
    obra_id: UUID | None = None
    registros: list[PontoItemLote]


class PontoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    funcionario_id: UUID
    obra_id: UUID | None
    data: date
    status: str
    horas: float | None
    observacoes: str | None
    funcionario_nome: str | None = None
