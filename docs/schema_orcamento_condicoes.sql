-- Adiciona condições de pagamento ao orçamento (melhoria do PDF)
-- Cole no SQL Editor do Supabase e clique em "Run".

alter table orcamentos add column if not exists condicoes_pagamento text;
