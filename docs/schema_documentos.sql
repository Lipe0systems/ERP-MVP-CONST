-- Módulo Documentos — V3-F4
-- Cole no SQL Editor do Supabase e clique em "Run".

create table documentos (
    id uuid primary key,
    empresa_id uuid not null references empresas(id) on delete cascade,
    nome varchar(255) not null,
    arquivo_url varchar(1000) not null,
    arquivo_nome varchar(255) not null,
    arquivo_tipo varchar(100) not null,
    arquivo_tamanho bigint not null,
    cliente_id uuid references clientes(id) on delete cascade,
    obra_id uuid references obras(id) on delete cascade,
    orcamento_id uuid references orcamentos(id) on delete cascade,
    descricao text,
    criado_em timestamp not null default now(),
    atualizado_em timestamp
);
create index ix_documentos_empresa_id on documentos (empresa_id);
create index ix_documentos_cliente_id on documentos (cliente_id);
create index ix_documentos_obra_id on documentos (obra_id);
create index ix_documentos_orcamento_id on documentos (orcamento_id);

alter table documentos disable row level security;

-- Bucket "documentos" no Supabase Storage (rode as policies abaixo no SQL Editor):
-- create policy "Authenticated upload"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'documentos');
-- create policy "Authenticated delete"
--   on storage.objects for delete to authenticated
--   using (bucket_id = 'documentos');
-- create policy "Authenticated read"
--   on storage.objects for select to authenticated
--   using (bucket_id = 'documentos');
