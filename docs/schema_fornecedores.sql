-- Módulo Fornecedores — V2
-- Cole no SQL Editor do Supabase e clique em "Run".

create table fornecedores (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    nome varchar(255) not null,
    documento varchar(14),
    email varchar(255),
    telefone varchar(20),
    endereco varchar(500),
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_fornecedores_empresa_id on fornecedores (empresa_id);
create index ix_fornecedores_nome on fornecedores (nome);

update alembic_version set version_num = '0009';
