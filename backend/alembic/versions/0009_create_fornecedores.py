"""Criação da tabela fornecedores.
Revision ID: 0009
Revises: 0008
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "fornecedores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("documento", sa.String(14)),
        sa.Column("email", sa.String(255)),
        sa.Column("telefone", sa.String(20)),
        sa.Column("endereco", sa.String(500)),
        sa.Column("observacoes", sa.Text),
        sa.Column("criado_em", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
    )
    op.create_index("ix_fornecedores_empresa_id", "fornecedores", ["empresa_id"])
    op.create_index("ix_fornecedores_nome", "fornecedores", ["nome"])


def downgrade() -> None:
    op.drop_table("fornecedores")
