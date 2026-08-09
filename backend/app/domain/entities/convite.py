"""
Entidade de domínio: ConviteUsuario.
Um convite permite que um novo usuário se junte a uma empresa existente.
O fluxo: admin cria convite → sistema envia link com token → usuário aceita
→ conta criada no Supabase Auth + vinculada à empresa.
Camada: Domain.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from uuid import UUID


class StatusConvite(str, Enum):
    PENDENTE = "pendente"
    ACEITO = "aceito"
    EXPIRADO = "expirado"
    CANCELADO = "cancelado"


class PapelUsuario(str, Enum):
    ADMIN = "admin"
    MEMBRO = "membro"
    VISUALIZADOR = "visualizador"

PAPEL_LABEL = {
    PapelUsuario.ADMIN: "Administrador",
    PapelUsuario.MEMBRO: "Membro",
    PapelUsuario.VISUALIZADOR: "Visualizador",
}


@dataclass
class ConviteUsuario:
    id: UUID
    empresa_id: UUID
    email: str
    papel: PapelUsuario = PapelUsuario.MEMBRO
    token: str = ""
    status: StatusConvite = StatusConvite.PENDENTE
    criado_por_id: UUID | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)
    expira_em: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(days=7))
