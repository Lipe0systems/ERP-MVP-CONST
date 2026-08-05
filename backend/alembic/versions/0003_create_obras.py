"""cria tabela obras

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "obras",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("cliente_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("endereco", sa.String(500)),
        sa.Column("responsavel", sa.String(255)),
        sa.Column("data_inicio", sa.Date),
        sa.Column("data_previsao", sa.Date),
        sa.Column("status", sa.String(20), nullable=False, server_default="planejamento"),
        sa.Column("valor_previsto", sa.Numeric(14, 2)),
        sa.Column("valor_realizado", sa.Numeric(14, 2)),
        sa.Column("criado_em", sa.DateTime, nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        # RESTRICT: uma obra vinculada impede a exclusão do cliente (tratado
        # como erro de negócio amigável em ClienteUseCases.remover).
        sa.ForeignKeyConstraint(["cliente_id"], ["clientes.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_obras_empresa_id", "obras", ["empresa_id"])
    op.create_index("ix_obras_cliente_id", "obras", ["cliente_id"])
    op.create_index("ix_obras_status", "obras", ["status"])


def downgrade() -> None:
    op.drop_table("obras")
