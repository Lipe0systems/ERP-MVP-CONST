-- Financeiro V2: comprovante de pagamento/recebimento
-- Cole no SQL Editor do Supabase e clique em "Run".

alter table contas_pagar add column if not exists comprovante_url varchar(1000);
alter table contas_receber add column if not exists comprovante_url varchar(1000);

-- Categoria em contas a receber (para a análise por categoria)
alter table contas_receber add column if not exists categoria varchar(100);
