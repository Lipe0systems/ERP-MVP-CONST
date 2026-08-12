-- Módulo RH básico (V4) — Funcionários, Vínculo a obras, Folha de ponto
-- Cole no SQL Editor do Supabase e clique em "Run".

-- ── Funcionários ─────────────────────────────────────────────────────────────
create table if not exists funcionarios (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    nome varchar(255) not null,
    cpf varchar(11),
    cargo varchar(120),
    salario numeric(14,2) not null default 0,
    tipo_contratacao varchar(30) not null default 'clt',  -- clt, diarista, empreiteiro, pj
    data_admissao date,
    data_demissao date,
    telefone varchar(20),
    email varchar(255),
    ativo boolean not null default true,
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_funcionarios_empresa on funcionarios (empresa_id);

-- ── Alocação: funcionário ↔ obra ─────────────────────────────────────────────
-- Um funcionário pode estar alocado em várias obras ao longo do tempo.
create table if not exists alocacoes_obra (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    funcionario_id uuid not null references funcionarios(id) on delete cascade,
    obra_id uuid not null references obras(id) on delete cascade,
    data_inicio date not null,
    data_fim date,
    funcao varchar(120),
    ativa boolean not null default true,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_alocacoes_empresa on alocacoes_obra (empresa_id);
create index ix_alocacoes_funcionario on alocacoes_obra (funcionario_id);
create index ix_alocacoes_obra on alocacoes_obra (obra_id);

-- ── Folha de ponto: presença diária ──────────────────────────────────────────
create table if not exists registros_ponto (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    funcionario_id uuid not null references funcionarios(id) on delete cascade,
    obra_id uuid references obras(id) on delete set null,
    data date not null,
    status varchar(20) not null default 'presente',  -- presente, falta, meio_periodo, atestado, ferias, folga
    horas numeric(5,2),
    observacoes text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp,
    unique (empresa_id, funcionario_id, data)  -- 1 registro por funcionário por dia
);
create index ix_ponto_empresa on registros_ponto (empresa_id);
create index ix_ponto_funcionario on registros_ponto (funcionario_id);
create index ix_ponto_data on registros_ponto (data);

alter table funcionarios disable row level security;
alter table alocacoes_obra disable row level security;
alter table registros_ponto disable row level security;
