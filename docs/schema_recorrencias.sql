-- Módulo Recorrência Financeira — Upgrade A3
-- Cole no SQL Editor do Supabase e clique em "Run".

create table recorrencias_financeiras (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    tipo varchar(10) not null,
    descricao varchar(255) not null,
    valor numeric(14,2) not null,
    dia_vencimento integer not null,
    ativo boolean not null default true,
    fornecedor varchar(255),
    cliente_id uuid references clientes(id) on delete set null,
    obra_id uuid references obras(id) on delete set null,
    categoria varchar(100),
    observacoes text,
    ultima_geracao date,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_recorrencias_empresa_id on recorrencias_financeiras (empresa_id);
create index ix_recorrencias_ativo on recorrencias_financeiras (ativo);

alter table recorrencias_financeiras disable row level security;
