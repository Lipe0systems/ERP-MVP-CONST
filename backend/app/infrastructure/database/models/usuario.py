"""
Modelo ORM: Usuário, sempre vinculado a uma Empresa.
Espelha o usuário do Supabase Auth (id igual ao auth.users.id).
Camada: Infrastructure.
"""
from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.infrastructure.database.models.base import TenantModel


class UsuarioModel(TenantModel):
    __tablename__ = "usuarios"

    # Sobrescreve o "id" herdado de BaseModel: ali ele tem default=uuid.uuid4,
    # o que geraria um UUID aleatório na criação. Para "usuarios" o id DEVE
    # ser sempre o mesmo id do auth.users do Supabase (definido explicitamente
    # pela camada de aplicação ao sincronizar o cadastro), nunca gerado aqui.
    id = Column(PGUUID(as_uuid=True), primary_key=True)

    nome = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    papel = Column(String(50), default="membro", nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    termos_aceitos_em = Column(DateTime, nullable=True)
    termos_versao = Column(String(20), nullable=True)
