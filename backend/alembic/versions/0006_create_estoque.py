"""cria tabela estoque

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "estoque",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produto", sa.String(255), nullable=False),
        sa.Column("quantidade", sa.Numeric(14, 3), nullable=False, server_default="0"),
        sa.Column("unidade", sa.String(20)),
        sa.Column("valor_medio", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("observacoes", sa.Text),
        sa.Column("criado_em", sa.DateTime, nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("empresa_id", "produto", name="uq_estoque_empresa_produto"),
    )
    op.create_index("ix_estoque_empresa_id", "estoque", ["empresa_id"])
    op.create_index("ix_estoque_produto", "estoque", ["produto"])


def downgrade() -> None:
    op.drop_table("estoque")
