-- Módulo Múltiplos Usuários (D2) — Convites + Papéis
-- Cole no SQL Editor do Supabase e clique em "Run".

-- Adicionar coluna papel na tabela usuários (se não existir)
alter table usuarios add column if not exists papel varchar(50) not null default 'membro';
alter table usuarios add column if not exists ativo boolean not null default true;

-- Tabela de convites
create table if not exists convites_usuario (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    email varchar(255) not null,
    papel varchar(20) not null default 'membro',
    token varchar(64) not null unique,
    status varchar(20) not null default 'pendente',
    criado_por_id uuid,
    expira_em timestamp not null,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_convites_empresa_id on convites_usuario (empresa_id);
create index ix_convites_token on convites_usuario (token);
create index ix_convites_email on convites_usuario (email);

alter table convites_usuario disable row level security;
