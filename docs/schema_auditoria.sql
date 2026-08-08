-- Módulo Auditoria — V3-F7
-- Cole no SQL Editor do Supabase e clique em "Run".

create table auditoria (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    usuario_id uuid not null,
    usuario_email varchar(255) not null,
    modulo varchar(50) not null,
    acao varchar(20) not null,
    entidade_id varchar(100) not null,
    descricao varchar(500) not null,
    dados_anteriores jsonb,
    dados_novos jsonb,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_auditoria_empresa_id on auditoria (empresa_id);
create index ix_auditoria_modulo on auditoria (modulo);
create index ix_auditoria_entidade_id on auditoria (entidade_id);
create index ix_auditoria_criado_em on auditoria (criado_em desc);

alter table auditoria disable row level security;
