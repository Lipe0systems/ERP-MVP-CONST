-- ═══════════════════════════════════════════════════════════════════════
-- ÍNDICES COMPOSTOS — OTIMIZAÇÃO DE PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════
-- Cole no SQL Editor do Supabase e clique em "Run".
--
-- CONTEXTO: as tabelas já têm índices INDIVIDUAIS em empresa_id e obra_id.
-- Porém, praticamente toda query do sistema filtra os dois JUNTOS (ou
-- empresa_id + status), por causa da arquitetura multi-tenant. Com índices
-- separados o Postgres precisa combinar dois índices ou escolher só um e
-- filtrar o resto linha a linha; com o composto, ele vai direto às linhas.
--
-- Cada índice abaixo tem uma query real do código que o justifica — nenhum
-- foi criado "por precaução". Índice não é de graça: ocupa espaço e torna
-- escrita mais lenta, então só entram os que pagam o custo.
--
-- CONCURRENTLY foi removido de propósito: o SQL Editor do Supabase roda
-- tudo dentro de uma transação implícita, e CONCURRENTLY não é permitido
-- nesse contexto — é assim mesmo executando uma linha de cada vez, então
-- não tem como contornar por ali.
--
-- O que isso custa: sem CONCURRENTLY, a criação do índice trava a tabela
-- para ESCRITA (não leitura) pelo tempo da criação — em tabelas pequenas
-- (a maioria aqui, num ERP desse porte) isso é da ordem de milissegundos
-- a poucos segundos, imperceptível. Só viraria problema real numa tabela
-- com milhões de linhas e tráfego de escrita constante, o que não é o
-- caso hoje. Se um dia a base crescer muito, esse mesmo SQL sem
-- CONCURRENTLY pode ser rodado direto via psql (fora do editor do
-- Supabase, sem a transação implícita) para evitar o lock.

-- ── Dashboard: /dashboard/saude-obras ─────────────────────────────────────
-- Query: agregação de custos por obra, filtrando empresa_id + obra_id IN (...)
create index if not exists idx_mov_estoque_empresa_obra
  on movimentacoes_estoque (empresa_id, obra_id);

create index if not exists idx_conta_pagar_empresa_obra
  on contas_pagar (empresa_id, obra_id);

create index if not exists idx_alocacao_empresa_obra
  on alocacoes_obra (empresa_id, obra_id);

-- ── Dashboard: contagem de obras por status ───────────────────────────────
-- Query: ObraModel.empresa_id == X AND ObraModel.status == 'em_andamento'
create index if not exists idx_obras_empresa_status
  on obras (empresa_id, status);

-- ── Financeiro: fluxo de caixa e totais pendentes ─────────────────────────
-- Query: empresa_id + status LIQUIDADO, agregado por data de pagamento
create index if not exists idx_conta_pagar_empresa_status_data
  on contas_pagar (empresa_id, status, data_pagamento);

create index if not exists idx_conta_receber_empresa_status_data
  on contas_receber (empresa_id, status, data_recebimento);

-- ── Orçamentos: listagem ordenada por número ──────────────────────────────
-- Query: empresa_id + ORDER BY numero DESC (paginação da listagem)
create index if not exists idx_orcamentos_empresa_numero
  on orcamentos (empresa_id, numero desc);

-- ── Soft delete: toda listagem filtra deletado_em IS NULL ─────────────────
-- Índice parcial: indexa SÓ as linhas ativas, ficando bem menor e mais
-- rápido que um índice completo (registros apagados não são consultados
-- nas listagens normais).
create index if not exists idx_clientes_empresa_ativos
  on clientes (empresa_id) where deletado_em is null;

create index if not exists idx_obras_empresa_ativas
  on obras (empresa_id) where deletado_em is null;
