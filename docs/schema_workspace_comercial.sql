-- Workspace Comercial (V4) — rastreia o estado do processo guiado
-- Cole no SQL Editor do Supabase e clique em "Run".

create table if not exists processos_comerciais (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    nome varchar(255),                       -- ex.: "Residencial João"
    cliente_id uuid references clientes(id) on delete set null,
    orcamento_id uuid references orcamentos(id) on delete set null,
    venda_id uuid references vendas(id) on delete set null,
    obra_id uuid references obras(id) on delete set null,
    fase varchar(30) not null default 'cliente',
    -- fases: cliente, orcamento, proposta, venda, obra, concluido
    criado_por_id uuid,
    criado_em timestamp not null default now(),
    atualizado_em timestamp,
    deletado_em timestamp
);
create index ix_processos_empresa on processos_comerciais (empresa_id);
create index ix_processos_fase on processos_comerciais (empresa_id, fase);
alter table processos_comerciais disable row level security;
