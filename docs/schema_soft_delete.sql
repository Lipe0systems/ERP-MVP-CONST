-- Soft Delete global (V4)
-- Adiciona a coluna deletado_em em todas as tabelas de negócio.
-- Registros com deletado_em preenchido ficam "na lixeira" (ocultos das listagens).
-- Cole no SQL Editor do Supabase e clique em "Run".

-- Tabelas de negócio que ganham lixeira.
-- (auditoria, convites e usuarios NÃO entram — são de sistema/controle)
alter table clientes                  add column if not exists deletado_em timestamp;
alter table obras                     add column if not exists deletado_em timestamp;
alter table fornecedores              add column if not exists deletado_em timestamp;
alter table orcamentos                add column if not exists deletado_em timestamp;
alter table orcamento_itens           add column if not exists deletado_em timestamp;
alter table vendas                    add column if not exists deletado_em timestamp;
alter table parcelas_venda            add column if not exists deletado_em timestamp;
alter table compras                   add column if not exists deletado_em timestamp;
alter table estoque                   add column if not exists deletado_em timestamp;
alter table historico_preco_estoque   add column if not exists deletado_em timestamp;
alter table contas_pagar              add column if not exists deletado_em timestamp;
alter table contas_receber            add column if not exists deletado_em timestamp;
alter table recorrencias_financeiras  add column if not exists deletado_em timestamp;
alter table contas_bancarias          add column if not exists deletado_em timestamp;
alter table lancamentos_bancarios     add column if not exists deletado_em timestamp;
alter table atendimentos              add column if not exists deletado_em timestamp;
alter table diario_obra               add column if not exists deletado_em timestamp;
alter table documentos                add column if not exists deletado_em timestamp;
alter table funcionarios              add column if not exists deletado_em timestamp;
alter table alocacoes_obra            add column if not exists deletado_em timestamp;
alter table registros_ponto           add column if not exists deletado_em timestamp;

-- Índices parciais: aceleram as listagens (que filtram deletado_em IS NULL)
create index if not exists ix_clientes_ativos     on clientes (empresa_id) where deletado_em is null;
create index if not exists ix_obras_ativos        on obras (empresa_id) where deletado_em is null;
create index if not exists ix_fornecedores_ativos on fornecedores (empresa_id) where deletado_em is null;
create index if not exists ix_orcamentos_ativos   on orcamentos (empresa_id) where deletado_em is null;
create index if not exists ix_compras_ativos      on compras (empresa_id) where deletado_em is null;

-- Tabelas de sistema: recebem a coluna para compatibilidade com o ORM,
-- mas NUNCA aparecem na Lixeira (não são expostas na página).
alter table auditoria          add column if not exists deletado_em timestamp;
alter table convites_usuario   add column if not exists deletado_em timestamp;
alter table usuarios           add column if not exists deletado_em timestamp;
alter table empresas           add column if not exists deletado_em timestamp;
