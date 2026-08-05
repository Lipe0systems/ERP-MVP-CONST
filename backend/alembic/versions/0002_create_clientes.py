"""cria tabela clientes

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "clientes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("documento", sa.String(14), nullable=False),
        sa.Column("email", sa.String(255)),
        sa.Column("telefone", sa.String(20)),
        sa.Column("endereco", sa.String(500)),
        sa.Column("observacoes", sa.Text),
        sa.Column("criado_em", sa.DateTime, nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("empresa_id", "documento", name="uq_clientes_empresa_documento"),
    )
    op.create_index("ix_clientes_empresa_id", "clientes", ["empresa_id"])
    op.create_index("ix_clientes_documento", "clientes", ["documento"])


def downgrade() -> None:
    op.drop_table("clientes")
