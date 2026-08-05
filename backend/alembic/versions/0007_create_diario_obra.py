"""cria tabela diario_obra

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "diario_obra",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("obra_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("data", sa.Date, nullable=False),
        sa.Column("clima", sa.String(30)),
        sa.Column("observacoes", sa.Text, nullable=False),
        sa.Column("fotos", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("criado_em", sa.DateTime, nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["obra_id"], ["obras.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_diario_obra_empresa_id", "diario_obra", ["empresa_id"])
    op.create_index("ix_diario_obra_obra_id", "diario_obra", ["obra_id"])
    op.create_index("ix_diario_obra_data", "diario_obra", ["data"])


def downgrade() -> None:
    op.drop_table("diario_obra")
