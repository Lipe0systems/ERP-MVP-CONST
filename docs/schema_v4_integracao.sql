-- V4 — Integração de Fluxos (Orçamento→Obra, Estoque→Obra, Resultado da Obra)
-- Cole no SQL Editor do Supabase e clique em "Run".

-- ── Obra: rastrear origem (de qual orçamento/venda ela nasceu) ────────────────
alter table obras add column if not exists orcamento_origem_id uuid references orcamentos(id) on delete set null;
alter table obras add column if not exists venda_origem_id uuid references vendas(id) on delete set null;

-- ── Orçamento-base da obra: snapshot do previsto no momento da criação ────────
-- Preserva o orçamento comercial original intacto; este é o "congelado" da obra.
create table if not exists orcamentos_base_obra (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    obra_id uuid not null references obras(id) on delete cascade,
    orcamento_origem_id uuid references orcamentos(id) on delete set null,
    valor_previsto numeric(14,2) not null default 0,
    descricao text,
    criado_em timestamp not null default now(),
    deletado_em timestamp,
    unique (obra_id)  -- uma obra tem só um orçamento-base
);
create index ix_orcbase_empresa on orcamentos_base_obra (empresa_id);
create index ix_orcbase_obra on orcamentos_base_obra (obra_id);
alter table orcamentos_base_obra disable row level security;

-- ── Movimentações de estoque: rastreabilidade completa ─────────────────────────
create table if not exists movimentacoes_estoque (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    estoque_id uuid not null references estoque(id) on delete cascade,
    produto varchar(255) not null,
    tipo varchar(20) not null,          -- entrada, transferencia, consumo, ajuste
    quantidade numeric(14,3) not null,
    origem varchar(50),                 -- ex: 'compra', 'estoque_central', 'manual'
    destino varchar(50),                -- ex: 'obra', 'estoque_central'
    obra_id uuid references obras(id) on delete set null,
    referencia_id uuid,                 -- ex: id da compra, quando origem='compra'
    usuario_id uuid,
    observacao text,
    criado_em timestamp not null default now(),
    deletado_em timestamp
);
create index ix_mov_estoque_empresa on movimentacoes_estoque (empresa_id);
create index ix_mov_estoque_obra on movimentacoes_estoque (obra_id);
create index ix_mov_estoque_item on movimentacoes_estoque (estoque_id);
create index ix_mov_estoque_criado on movimentacoes_estoque (criado_em desc);
alter table movimentacoes_estoque disable row level security;

-- ── Financeiro → Banco: rastrear o lançamento gerado por um pagamento/recebimento
alter table contas_pagar add column if not exists lancamento_bancario_id uuid references lancamentos_bancarios(id) on delete set null;
alter table contas_receber add column if not exists lancamento_bancario_id uuid references lancamentos_bancarios(id) on delete set null;
alter table contas_pagar add column if not exists conta_bancaria_id uuid references contas_bancarias(id) on delete set null;
alter table contas_receber add column if not exists conta_bancaria_id uuid references contas_bancarias(id) on delete set null;
