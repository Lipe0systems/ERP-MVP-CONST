-- ═══════════════════════════════════════════════════════════════════════════
-- RLS (Row Level Security) — defesa em profundidade multi-tenant
-- Corrige o achado [HIGH] "RLS desabilitado em todas as tabelas" da auditoria.
--
-- IMPORTANTE — LEIA ANTES DE APLICAR EM PRODUÇÃO:
--
-- 1. Este SQL depende de o backend definir a variável de sessão
--    `app.current_empresa_id` no início de cada requisição autenticada.
--    Isso já foi implementado em `app/core/security.py` (função
--    get_current_user, via `SET LOCAL app.current_empresa_id = ...`), como
--    parte da mesma correção. NÃO aplique este SQL sem esse código já
--    estar no ar — sem ele, toda query passaria a não bater com nenhuma
--    policy e o sistema pararia de retornar dados (falha seguro: nega
--    acesso em vez de vazar dados, mas quebra a aplicação).
--
-- 2. `SET LOCAL` vale só para a transação atual. Se algum endpoint fizer
--    mais de um `db.commit()` no meio de uma mesma requisição, as queries
--    feitas DEPOIS desse commit ficam sem a variável definida — e como a
--    policy nega por padrão quando a variável está vazia, essas queries
--    específicas passam a retornar vazio em vez de dados reais. Isso é
--    seguro (não vaza nada), mas pode quebrar funcionalidade em endpoints
--    que fazem múltiplos commits. RECOMENDO TESTAR CADA FLUXO EM
--    HOMOLOGAÇÃO ANTES DE APLICAR EM PRODUÇÃO, especialmente os que você
--    sabe que commitam mais de uma vez na mesma requisição (ex.: criação
--    de obra a partir de orçamento, pagamento em lote).
--
-- 3. A conexão que o backend usa com o Postgres precisa ter permissão para
--    executar `SET LOCAL` (qualquer role normal consegue) e as policies
--    abaixo assumem que essa é a ÚNICA via de acesso ao banco — se algo
--    mais acessa o Postgres diretamente (um BI, um script administrativo),
--    também vai ser filtrado por essas policies a menos que rode como
--    superusuário/dono da tabela (que ignora RLS por padrão no Postgres).
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  tabela text;
  tabelas text[] := array[
    'alocacoes_obra', 'atendimentos', 'auditoria', 'clientes', 'compras',
    'contas_bancarias', 'contas_pagar', 'contas_receber',
    'diario_obra', 'documentos', 'estoque', 'fornecedores', 'funcionarios',
    'movimentacoes_estoque', 'obras', 'orcamentos', 'orcamentos_base_obra',
    'processos_comerciais', 'recorrencias_financeiras',
    'registros_ponto', 'vendas'
  ];
begin
  foreach tabela in array tabelas loop
    execute format('alter table %I enable row level security;', tabela);
    execute format('alter table %I force row level security;', tabela);

    -- Remove a policy se já existir (permite rodar este script mais de uma
    -- vez sem erro) e recria.
    execute format('drop policy if exists tenant_isolation on %I;', tabela);
    execute format(
      'create policy tenant_isolation on %I
         using (empresa_id = current_setting(''app.current_empresa_id'', true)::uuid)
         with check (empresa_id = current_setting(''app.current_empresa_id'', true)::uuid);',
      tabela
    );
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELAS PROPOSITALMENTE FORA DO RLS — leia antes de "corrigir" isto
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── Grupo 1: precisam ser lidas ANTES de a empresa ser conhecida ──
--
-- `usuarios`  → é consultada para DESCOBRIR a empresa do usuário logado
--   (app/core/security.py, get_current_user). Se ela tivesse RLS, haveria um
--   deadlock de inicialização: para ler a tabela seria preciso já saber a
--   empresa, mas é justamente essa leitura que descobre a empresa. Resultado
--   prático: NINGUÉM conseguiria autenticar no sistema.
--   Mitigação existente: todos os endpoints que expõem usuarios já filtram
--   por empresa_id explicitamente (usuarios.py), e a consulta do login busca
--   por chave primária (id do Supabase Auth), que o usuário não pode forjar
--   — o token é validado contra o servidor do Supabase antes.
--
-- `convites_usuario` → é consultada por usuário AINDA NÃO AUTENTICADO, no
--   fluxo público de aceitar convite (GET .../validar e POST .../aceitar).
--   Nesse momento não existe empresa na sessão, então o RLS bloquearia e
--   nenhum convite poderia ser aceito. O controle de acesso aqui é o próprio
--   token do convite (64 caracteres aleatórios, com expiração e uso único).
--
-- ── Grupo 2: NÃO POSSUEM a coluna empresa_id (limitação conhecida) ──
--
-- `lancamentos_bancarios`, `orcamento_itens`, `parcelas_venda`
--   Essas três tabelas herdam BaseModel (e não TenantModel) no ORM, ou seja,
--   não têm coluna empresa_id — o isolamento delas hoje é INDIRETO, via a
--   tabela-pai (conta bancária, orçamento e venda, respectivamente), que
--   essas sim são protegidas pelo RLS.
--
--   CONSEQUÊNCIA PRÁTICA: uma query que acessasse essas tabelas diretamente,
--   sem passar pelo pai, não teria proteção do banco. Hoje o código sempre
--   passa pelo pai, mas isso é uma garantia do código, não do banco — a mesma
--   fragilidade que motivou habilitar RLS no resto do sistema.
--
--   RECOMENDAÇÃO (trabalho futuro, fora do escopo desta correção): adicionar
--   coluna empresa_id nessas três tabelas, popular a partir do pai, e então
--   incluí-las na lista acima. Requer migração de dados, por isso não foi
--   feito automaticamente aqui.
--
-- `empresas` → não possui coluna empresa_id (ela É a empresa). Só é acessada
--   pelo admin do SaaS via onboarding.py, que tem verificação própria.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ATENÇÃO: SUPERUSUÁRIO IGNORA RLS
-- ═══════════════════════════════════════════════════════════════════════════
-- No PostgreSQL, uma conexão feita por um superusuário (ou pelo dono da
-- tabela, quando não se usa FORCE — por isso o FORCE acima) ignora RLS
-- completamente. Se a DATABASE_URL do backend estiver usando o usuário
-- `postgres` do Supabase, TODAS as policies acima serão silenciosamente
-- ignoradas e este arquivo não terá efeito prático nenhum.
--
-- VERIFIQUE, depois de aplicar, rodando isto conectado como a aplicação:
--   select current_user, usesuper from pg_user where usename = current_user;
-- Se `usesuper` for true, crie um role dedicado sem superusuário para a
-- aplicação e aponte a DATABASE_URL para ele — caso contrário o RLS é
-- apenas decorativo.


