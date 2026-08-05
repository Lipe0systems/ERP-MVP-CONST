-- ERP Construtoras — schema completo (equivalente a `alembic upgrade head`)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Ordem já respeita as dependências de chave estrangeira.

create extension if not exists pgcrypto;

-- ============================================================
-- Fase 1: empresas, usuarios
-- ============================================================
create table empresas (
    id uuid primary key,
    nome varchar(255) not null,
    cnpj varchar(20) not null unique,
    email varchar(255),
    telefone varchar(20),
    ativo boolean not null default true,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create unique index ix_empresas_cnpj on empresas (cnpj);

create table usuarios (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    nome varchar(255) not null,
    email varchar(255) not null,
    papel varchar(50) not null default 'membro',
    ativo boolean not null default true,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_usuarios_empresa_id on usuarios (empresa_id);
create index ix_usuarios_email on usuarios (email);

-- ============================================================
-- Fase 2: clientes
-- ============================================================
create table clientes (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    nome varchar(255) not null,
    documento varchar(14) not null,
    email varchar(255),
    telefone varchar(20),
    endereco varchar(500),
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp,
    constraint uq_clientes_empresa_documento unique (empresa_id, documento)
);
create index ix_clientes_empresa_id on clientes (empresa_id);
create index ix_clientes_documento on clientes (documento);

-- ============================================================
-- Fase 3: obras
-- ============================================================
create table obras (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    nome varchar(255) not null,
    cliente_id uuid not null references clientes(id) on delete restrict,
    endereco varchar(500),
    responsavel varchar(255),
    data_inicio date,
    data_previsao date,
    status varchar(20) not null default 'planejamento',
    valor_previsto numeric(14, 2),
    valor_realizado numeric(14, 2),
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_obras_empresa_id on obras (empresa_id);
create index ix_obras_cliente_id on obras (cliente_id);
create index ix_obras_status on obras (status);

-- ============================================================
-- Fase 4: contas_pagar, contas_receber
-- ============================================================
create table contas_pagar (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    descricao varchar(255) not null,
    valor numeric(14, 2) not null,
    data_vencimento date not null,
    fornecedor varchar(255),
    obra_id uuid references obras(id) on delete restrict,
    categoria varchar(100),
    data_pagamento date,
    status varchar(20) not null default 'pendente',
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_contas_pagar_empresa_id on contas_pagar (empresa_id);
create index ix_contas_pagar_obra_id on contas_pagar (obra_id);
create index ix_contas_pagar_status on contas_pagar (status);
create index ix_contas_pagar_data_vencimento on contas_pagar (data_vencimento);

create table contas_receber (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    descricao varchar(255) not null,
    valor numeric(14, 2) not null,
    data_vencimento date not null,
    cliente_id uuid references clientes(id) on delete restrict,
    obra_id uuid references obras(id) on delete restrict,
    data_recebimento date,
    status varchar(20) not null default 'pendente',
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_contas_receber_empresa_id on contas_receber (empresa_id);
create index ix_contas_receber_cliente_id on contas_receber (cliente_id);
create index ix_contas_receber_obra_id on contas_receber (obra_id);
create index ix_contas_receber_status on contas_receber (status);
create index ix_contas_receber_data_vencimento on contas_receber (data_vencimento);

-- ============================================================
-- Fase 5: compras
-- ============================================================
create table compras (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    fornecedor varchar(255) not null,
    produto varchar(255) not null,
    quantidade numeric(14, 3) not null,
    unidade varchar(20),
    valor_unitario numeric(14, 2) not null,
    data_compra date not null,
    obra_id uuid references obras(id) on delete restrict,
    status varchar(20) not null default 'pendente',
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_compras_empresa_id on compras (empresa_id);
create index ix_compras_obra_id on compras (obra_id);
create index ix_compras_status on compras (status);
create index ix_compras_data_compra on compras (data_compra);

-- ============================================================
-- Fase 6: estoque
-- ============================================================
create table estoque (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    produto varchar(255) not null,
    quantidade numeric(14, 3) not null default 0,
    unidade varchar(20),
    valor_medio numeric(14, 2) not null default 0,
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp,
    constraint uq_estoque_empresa_produto unique (empresa_id, produto)
);
create index ix_estoque_empresa_id on estoque (empresa_id);
create index ix_estoque_produto on estoque (produto);

-- ============================================================
-- Fase 7: diario_obra
-- ============================================================
create table diario_obra (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    obra_id uuid not null references obras(id) on delete restrict,
    data date not null,
    clima varchar(30),
    observacoes text not null,
    fotos jsonb not null default '[]',
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_diario_obra_empresa_id on diario_obra (empresa_id);
create index ix_diario_obra_obra_id on diario_obra (obra_id);
create index ix_diario_obra_data on diario_obra (data);

-- ============================================================
-- Registro de controle do Alembic (opcional, mas evita confusão
-- se algum dia você rodar `alembic upgrade head` de outra máquina)
-- ============================================================
create table if not exists alembic_version (
    version_num varchar(32) not null primary key
);
insert into alembic_version (version_num) values ('0007');
