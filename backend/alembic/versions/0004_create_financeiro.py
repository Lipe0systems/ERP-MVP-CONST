"""cria tabelas contas_pagar e contas_receber

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contas_pagar",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("descricao", sa.String(255), nullable=False),
        sa.Column("valor", sa.Numeric(14, 2), nullable=False),
        sa.Column("data_vencimento", sa.Date, nullable=False),
        sa.Column("fornecedor", sa.String(255)),
        sa.Column("obra_id", postgresql.UUID(as_uuid=True)),
        sa.Column("categoria", sa.String(100)),
        sa.Column("data_pagamento", sa.Date),
        sa.Column("status", sa.String(20), nullable=False, server_default="pendente"),
        sa.Column("observacoes", sa.Text),
        sa.Column("criado_em", sa.DateTime, nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["obra_id"], ["obras.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_contas_pagar_empresa_id", "contas_pagar", ["empresa_id"])
    op.create_index("ix_contas_pagar_obra_id", "contas_pagar", ["obra_id"])
    op.create_index("ix_contas_pagar_status", "contas_pagar", ["status"])
    op.create_index("ix_contas_pagar_data_vencimento", "contas_pagar", ["data_vencimento"])

    op.create_table(
        "contas_receber",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("empresa_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("descricao", sa.String(255), nullable=False),
        sa.Column("valor", sa.Numeric(14, 2), nullable=False),
        sa.Column("data_vencimento", sa.Date, nullable=False),
        sa.Column("cliente_id", postgresql.UUID(as_uuid=True)),
        sa.Column("obra_id", postgresql.UUID(as_uuid=True)),
        sa.Column("data_recebimento", sa.Date),
        sa.Column("status", sa.String(20), nullable=False, server_default="pendente"),
        sa.Column("observacoes", sa.Text),
        sa.Column("criado_em", sa.DateTime, nullable=False),
        sa.Column("atualizado_em", sa.DateTime),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cliente_id"], ["clientes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["obra_id"], ["obras.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_contas_receber_empresa_id", "contas_receber", ["empresa_id"])
    op.create_index("ix_contas_receber_cliente_id", "contas_receber", ["cliente_id"])
    op.create_index("ix_contas_receber_obra_id", "contas_receber", ["obra_id"])
    op.create_index("ix_contas_receber_status", "contas_receber", ["status"])
    op.create_index("ix_contas_receber_data_vencimento", "contas_receber", ["data_vencimento"])


def downgrade() -> None:
    op.drop_table("contas_receber")
    op.drop_table("contas_pagar")
