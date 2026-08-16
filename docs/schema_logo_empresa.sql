-- Logo por empresa (multi-tenant). Cole no SQL Editor do Supabase e Run.
--
-- Guarda o CAMINHO no Storage, não a URL: URLs assinadas expiram (o sistema
-- usa 365 dias, mas ainda assim expiram) — gerar a URL assinada é sempre
-- feito na hora da leitura, nunca guardado como valor fixo no banco.
alter table empresas add column if not exists logo_path text;
