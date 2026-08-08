-- Estoque V2: estoque mínimo + histórico de preços
-- Cole no SQL Editor do Supabase e clique em "Run".

-- Coluna de estoque mínimo
alter table estoque add column if not exists estoque_minimo numeric(14,3);

-- Tabela de histórico de preços (entrada por compra ou ajuste manual)
create table if not exists historico_preco_estoque (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    produto varchar(255) not null,
    quantidade numeric(14,3) not null,
    valor_unitario numeric(14,2) not null,
    origem varchar(50) not null default 'compra', -- 'compra' ou 'ajuste'
    referencia_id uuid,    -- id da compra se origem='compra'
    criado_em timestamp not null default now()
);
create index ix_hist_preco_empresa_produto on historico_preco_estoque (empresa_id, produto);
create index ix_hist_preco_criado_em on historico_preco_estoque (criado_em desc);

alter table historico_preco_estoque disable row level security;
