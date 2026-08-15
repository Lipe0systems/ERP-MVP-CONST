-- Módulo Ordens de Serviço + papel "instalador".
-- Cole no SQL Editor do Supabase e clique em "Run".

create table if not exists ordens_servico (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references empresas(id) on delete cascade,
    numero integer not null,
    titulo varchar(255) not null,
    descricao text,
    cliente_id uuid references clientes(id) on delete set null,
    obra_id uuid references obras(id) on delete set null,
    instalador_id uuid references usuarios(id) on delete set null,
    status varchar(20) not null default 'pendente',  -- pendente | em_andamento | concluida | cancelada
    endereco varchar(500),
    data_agendada date,
    foto_conclusao_url text,
    observacoes_conclusao text,
    concluido_em timestamp,
    criado_em timestamp not null default now(),
    atualizado_em timestamp,
    deletado_em timestamp
);

create index if not exists idx_ordens_servico_empresa on ordens_servico(empresa_id);
create index if not exists idx_ordens_servico_instalador on ordens_servico(instalador_id);
create index if not exists idx_ordens_servico_status on ordens_servico(status);

-- RLS, mesmo padrão do restante do sistema (ver docs/schema_rls.sql)
alter table ordens_servico enable row level security;
alter table ordens_servico force row level security;
drop policy if exists tenant_isolation on ordens_servico;
create policy tenant_isolation on ordens_servico
  using (empresa_id = current_setting('app.current_empresa_id', true)::uuid)
  with check (empresa_id = current_setting('app.current_empresa_id', true)::uuid);
