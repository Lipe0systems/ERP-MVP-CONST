-- Módulo Vendas — V3-F6
-- Cole no SQL Editor do Supabase e clique em "Run".

create table vendas (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    numero integer not null,
    cliente_id uuid not null references clientes(id) on delete restrict,
    orcamento_id uuid references orcamentos(id) on delete set null,
    obra_id uuid references obras(id) on delete restrict,
    status varchar(20) not null default 'aberta',
    forma_pagamento varchar(20) not null default 'avista',
    valor_total numeric(14,2) not null default 0,
    desconto numeric(14,2) not null default 0,
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_vendas_empresa_id on vendas (empresa_id);
create index ix_vendas_cliente_id on vendas (cliente_id);
create index ix_vendas_status on vendas (status);

create table parcelas_venda (
    id uuid primary key,
    venda_id uuid not null references vendas(id) on delete cascade,
    empresa_id uuid not null,
    numero integer not null,
    valor numeric(14,2) not null,
    vencimento date not null,
    conta_receber_id uuid references contas_receber(id) on delete set null,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_parcelas_venda_venda_id on parcelas_venda (venda_id);

alter table vendas disable row level security;
alter table parcelas_venda disable row level security;
