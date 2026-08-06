"""Criação das tabelas orcamentos e orcamento_itens.

Revision ID: 0008
Revises: 0007
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "orcamentos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("numero", sa.Integer, nullable=False),
        sa.Column("cliente_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clientes.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("obra_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("obras.id", ondelete="RESTRICT")),
        sa.Column("status", sa.String(20), nullable=False, server_default="rascunho"),
        sa.Column("validade", sa.Date),
        sa.Column("observacoes", sa.Text),
        sa.Column("conta_receber_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contas_receber.id", ondelete="SET NULL")),
        sa.Column("criado_em", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
    )
    op.create_index("ix_orcamentos_empresa_id", "orcamentos", ["empresa_id"])
    op.create_index("ix_orcamentos_cliente_id", "orcamentos", ["cliente_id"])
    op.create_index("ix_orcamentos_obra_id", "orcamentos", ["obra_id"])
    op.create_index("ix_orcamentos_status", "orcamentos", ["status"])

    op.create_table(
        "orcamento_itens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("orcamento_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orcamentos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("descricao", sa.String(255), nullable=False),
        sa.Column("quantidade", sa.Numeric(14, 3), nullable=False),
        sa.Column("unidade", sa.String(20)),
        sa.Column("valor_unitario", sa.Numeric(14, 2), nullable=False),
        sa.Column("estoque_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("estoque.id", ondelete="SET NULL")),
        sa.Column("criado_em", sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
    )
    op.create_index("ix_orcamento_itens_orcamento_id", "orcamento_itens", ["orcamento_id"])


def downgrade() -> None:
    op.drop_table("orcamento_itens")
    op.drop_table("orcamentos")
