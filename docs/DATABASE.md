# Estrutura do Banco de Dados

## Convenções

- Chave primária: UUID (`uuid_generate_v4()` / gerado na aplicação)
- Toda tabela de domínio (exceto `empresas`) possui `empresa_id` (FK) para isolamento multi-tenant
- Timestamps: `criado_em`, `atualizado_em`
- Migrations gerenciadas via Alembic (`backend/alembic/versions`)

## Tabelas (Fase 1)

### empresas
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador da empresa (tenant) |
| nome | varchar(255) | Razão social / nome fantasia |
| cnpj | varchar(20) | CNPJ, único |
| email | varchar(255) | E-mail de contato |
| telefone | varchar(20) | Telefone de contato |
| ativo | boolean | Empresa ativa/inativa |
| criado_em / atualizado_em | timestamp | Auditoria |

### usuarios
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Igual ao `auth.users.id` do Supabase |
| empresa_id | UUID (FK → empresas.id) | Empresa à qual o usuário pertence |
| nome | varchar(255) | Nome do usuário |
| email | varchar(255) | E-mail (espelha o Supabase Auth) |
| papel | varchar(50) | `admin` \| `membro` |
| ativo | boolean | Usuário ativo/inativo |

## Fase 5 — tabela `compras`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador da compra |
| empresa_id | UUID (FK → empresas.id) | Empresa proprietária do registro |
| fornecedor | varchar(255) | Fornecedor (texto livre) |
| produto | varchar(255) | Produto/material comprado |
| quantidade | numeric(14,3) | Quantidade (> 0; 3 casas decimais para unidades como m³, kg) |
| unidade | varchar(20) | Unidade de medida (opcional: un, kg, m³, saco...) |
| valor_unitario | numeric(14,2) | Valor por unidade (> 0) |
| data_compra | date | Data da compra |
| obra_id | UUID (FK → obras.id, `ON DELETE RESTRICT`) | Obra vinculada (opcional) |
| status | varchar(20) | `pendente` \| `aprovada` \| `recebida` \| `cancelada` |
| observacoes | text | Observações (opcional) |

`valor_total` **não é uma coluna** — é sempre `quantidade × valor_unitário`, calculado no schema de resposta (`CompraOut.valor_total`, via `@computed_field`) e no preview ao vivo do formulário, seguindo o mesmo princípio já aplicado a "Atrasado" (Financeiro) e a `obra_nome`/`cliente_nome` (JOINs de listagem): nunca armazenar o que pode ser derivado, para nunca ficar dessincronizado.

## Fase 4 — tabelas `contas_pagar` e `contas_receber`

### contas_pagar
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador do lançamento |
| empresa_id | UUID (FK → empresas.id) | Empresa proprietária do registro |
| descricao | varchar(255) | Descrição do lançamento |
| valor | numeric(14,2) | Valor (> 0) |
| data_vencimento | date | Data de vencimento |
| fornecedor | varchar(255) | Fornecedor (opcional, texto livre) |
| obra_id | UUID (FK → obras.id, `ON DELETE RESTRICT`) | Obra vinculada (opcional) |
| categoria | varchar(100) | Categoria livre (opcional) |
| data_pagamento | date | Preenchida ao marcar como paga |
| status | varchar(20) | `pendente` \| `liquidado` \| `cancelado` |
| observacoes | text | Observações (opcional) |

### contas_receber
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador do lançamento |
| empresa_id | UUID (FK → empresas.id) | Empresa proprietária do registro |
| descricao | varchar(255) | Descrição do lançamento |
| valor | numeric(14,2) | Valor (> 0) |
| data_vencimento | date | Data de vencimento |
| cliente_id | UUID (FK → clientes.id, `ON DELETE RESTRICT`) | Cliente vinculado (opcional) |
| obra_id | UUID (FK → obras.id, `ON DELETE RESTRICT`) | Obra vinculada (opcional) |
| data_recebimento | date | Preenchida ao marcar como recebida |
| status | varchar(20) | `pendente` \| `liquidado` \| `cancelado` |
| observacoes | text | Observações (opcional) |

O status "Atrasado" exibido na interface **não é uma coluna** — é calculado em tempo real (`status = pendente` e `data_vencimento` no passado) tanto no backend (`esta_atrasada`) quanto no frontend (`StatusContaBadge`), evitando que fique desatualizado sem um job periódico.

Da mesma forma, `obra_nome` (em `contas_pagar`) e `cliente_nome`/`obra_nome` (em `contas_receber`) **não são colunas** — são obtidos via `LEFT JOIN` apenas na listagem paginada, para que os formulários de edição sempre consigam pré-selecionar corretamente o cliente/obra vinculados nos dropdowns, mesmo quando estão fora da primeira página de opções carregada.

## Fase 3 — tabela `obras`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador da obra |
| empresa_id | UUID (FK → empresas.id) | Empresa proprietária do registro |
| nome | varchar(255) | Nome da obra |
| cliente_id | UUID (FK → clientes.id, `ON DELETE RESTRICT`) | Cliente vinculado — impede excluir o cliente enquanto houver obras |
| endereco | varchar(500) | Endereço da obra (opcional) |
| responsavel | varchar(255) | Responsável pela obra (opcional) |
| data_inicio | date | Data de início (opcional) |
| data_previsao | date | Previsão de término (opcional; não pode ser anterior à data de início) |
| status | varchar(20) | `planejamento` \| `em_andamento` \| `pausada` \| `concluida` \| `cancelada` |
| valor_previsto | numeric(14,2) | Valor orçado (opcional) |
| valor_realizado | numeric(14,2) | Valor efetivamente gasto (opcional) |
| criado_em / atualizado_em | timestamp | Auditoria |

## Fase 2 — tabela `clientes`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador do cliente |
| empresa_id | UUID (FK → empresas.id) | Empresa proprietária do registro |
| nome | varchar(255) | Nome / razão social |
| documento | varchar(14) | CPF ou CNPJ, apenas dígitos, único por empresa |
| email | varchar(255) | E-mail de contato (opcional) |
| telefone | varchar(20) | Telefone (opcional) |
| endereco | varchar(500) | Endereço (opcional) |
| observacoes | text | Observações livres (opcional) |
| criado_em / atualizado_em | timestamp | Auditoria |

Restrição `UNIQUE(empresa_id, documento)`: a mesma empresa não pode cadastrar o mesmo CPF/CNPJ duas vezes; empresas diferentes podem.

## Fase 6 — tabela `estoque`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador do item |
| empresa_id | UUID (FK → empresas.id) | Empresa proprietária do registro |
| produto | varchar(255) | Nome do produto/material, único por empresa |
| quantidade | numeric(14,3) | Quantidade em estoque (>= 0) |
| unidade | varchar(20) | Unidade de medida (opcional: un, kg, m³, saco...) |
| valor_medio | numeric(14,2) | Valor médio por unidade (>= 0) |
| observacoes | text | Observações (opcional) |

Restrição `UNIQUE(empresa_id, produto)`: a mesma empresa não pode cadastrar o mesmo produto duas vezes (mesmo padrão do CPF/CNPJ em Clientes). `valor_total` não é uma coluna — é sempre `quantidade × valor_médio`, calculado no schema de resposta.

## Fase 7 — tabela `diario_obra`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador do registro |
| empresa_id | UUID (FK → empresas.id) | Empresa proprietária do registro |
| obra_id | UUID (FK → obras.id, `ON DELETE RESTRICT`) | Obra vinculada — **obrigatório**, diferente do vínculo opcional em Compras/Financeiro |
| data | date | Data do registro |
| clima | varchar(30) | `ensolarado` \| `parcialmente_nublado` \| `nublado` \| `chuvoso` \| `tempestade` (opcional) |
| observacoes | text | Descrição das atividades do dia |
| fotos | jsonb | Lista de URLs públicas do Supabase Storage (máx. 10 por registro) |

`fotos` guarda só as URLs — os arquivos binários vivem inteiramente no Supabase Storage (bucket `diario-obra`, ver `docs/DEPLOY.md`), nunca passam pelo backend.
