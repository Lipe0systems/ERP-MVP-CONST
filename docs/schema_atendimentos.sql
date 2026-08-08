-- Módulo Atendimentos — V3-F5
-- Cole no SQL Editor do Supabase e clique em "Run".

create table atendimentos (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    cliente_id uuid not null references clientes(id) on delete restrict,
    obra_id uuid references obras(id) on delete restrict,
    tipo varchar(20) not null default 'visita',
    status varchar(20) not null default 'agendado',
    data date not null,
    hora time,
    responsavel varchar(255),
    descricao text,
    checklist text[] not null default '{}',
    checklist_ok text[] not null default '{}',
    fotos text[] not null default '{}',
    assinatura_url varchar(1000),
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_atendimentos_empresa_id on atendimentos (empresa_id);
create index ix_atendimentos_cliente_id on atendimentos (cliente_id);
create index ix_atendimentos_obra_id on atendimentos (obra_id);
create index ix_atendimentos_status on atendimentos (status);
create index ix_atendimentos_data on atendimentos (data);

alter table atendimentos disable row level security;
