"""cria tabela compras

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "compras",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("fornecedor", sa.String(255), nullable=False),
        sa.Column("produto", sa.String(255), nullable=False),
        sa.Column("quantidade", sa.Numeric(14, 3), nullable=False),
        sa.Column("unidade", sa.String(20)),
        sa.Column("valor_unitario", sa.Numeric(14, 2), nullable=False),
        sa.Column("data_compra", sa.Date, nullable=False),
        sa.Column("obra_id", postgresql.UUID(as_uuid=True)),
        sa.Column("status", sa.String(20), nullable=False, server_default="pendente"),
        sa.Column("observacoes", sa.Text),
        sa.Column("criado_em", sa.DateTime, nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["obra_id"], ["obras.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_compras_empresa_id", "compras", ["empresa_id"])
    op.create_index("ix_compras_obra_id", "compras", ["obra_id"])
    op.create_index("ix_compras_status", "compras", ["status"])
    op.create_index("ix_compras_data_compra", "compras", ["data_compra"])


def downgrade() -> None:
    op.drop_table("compras")
