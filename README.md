# ERP Construtoras — V1 (MVP)

ERP SaaS multiempresa (multi-tenant) para construtoras, construído com Next.js 15 + FastAPI + Supabase.

## Estrutura do projeto

```
erp-construtoras/
├── frontend/     # Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
├── backend/      # FastAPI + SQLAlchemy + Alembic (Clean Architecture)
└── docs/         # Documentação (deploy, banco de dados)
```

## Fase 1 (concluída)

- Estrutura do projeto (frontend/backend/docs)
- Arquitetura backend em Clean Architecture (domain / application / infrastructure / presentation)
- Configuração do Supabase (Auth, Postgres) via variáveis de ambiente
- Autenticação: login, logout, recuperação de senha, proteção de rotas via middleware
- Layout base: sidebar moderna, header com dark/light mode
- Dashboard inicial com cards de indicadores e gráfico de fluxo de caixa

## Como rodar localmente

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # preencha com suas credenciais Supabase
alembic upgrade head
uvicorn app.main:app --reload
```

API disponível em `http://localhost:8000`, documentação Swagger em `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # preencha com suas credenciais Supabase
npm run dev
```

Frontend disponível em `http://localhost:3000`.

## Fase 2 (concluída) — Clientes

- CRUD completo de Clientes (listar com busca e paginação, criar, editar, remover)
- Validação real de CPF/CNPJ (dígito verificador), duplicada no frontend (feedback imediato) e no backend (fonte da verdade)
- Isolamento multi-tenant: toda consulta/gravação é filtrada por `empresa_id` do usuário autenticado
- Modais de criação/edição e confirmação de exclusão, com toasts de sucesso/erro
- Estados de loading (skeleton), lista vazia e erro tratados na tela

## Fase 3 (concluída) — Obras

- CRUD completo de Obras (listar com busca, filtro por status e paginação, criar, editar, remover)
- Vínculo obrigatório com Cliente (seleção via dropdown), validado no backend antes de criar/atualizar
- Status com 5 estados (planejamento, em andamento, pausada, concluída, cancelada), exibido com badge colorido
- Validação de datas (previsão não pode ser anterior ao início) — no frontend (Zod) e no backend (fonte da verdade)
- Regra de integridade: um Cliente com Obras vinculadas não pode ser removido (erro 409 amigável, antes seria um erro 500 de banco)
- Dashboard inicial deixou de ser mockado para "Obras ativas", "Obras concluídas" e "Clientes" — números reais, calculados via `COUNT` no banco

## Fase 4 (concluída) — Financeiro

- CRUD completo de Contas a Pagar e Contas a Receber (busca, filtro por status, paginação)
- Vínculo opcional com Obra (ambas) e com Cliente (Contas a Receber) — validado no backend
- Status "Atrasado" é **calculado**, nunca armazenado (pendente + vencimento no passado) — nunca fica desatualizado
- Resumo financeiro (`/financeiro/resumo`): total a pagar, total a receber, saldo previsto e fluxo de caixa dos últimos 6 meses
- Regra de integridade: Obras/Clientes com lançamentos financeiros vinculados não podem ser removidos (409 amigável, mesmo padrão já usado em Obras↔Clientes)
- Dashboard: **nenhum indicador mockado restante** — "Contas a pagar", "Contas a receber" e o gráfico de fluxo de caixa agora refletem dados reais

## Fase 5 (concluída) — Compras

- CRUD completo de Compras (produto, fornecedor, quantidade, unidade, valor unitário, data, status, vínculo opcional com Obra)
- "Valor total" nunca é armazenado — calculado (`quantidade × valor_unitário`) tanto no backend (`Compra.valor_total`, `computed_field`) quanto no preview ao vivo do formulário
- Mesma proteção de integridade referencial: Obra com compras vinculadas não pode ser removida (409 amigável, reaproveitando o tratamento já existente)
- Refatoração: modal de confirmação de exclusão consolidado em um único componente (`DeleteConfirmDialog`), reaproveitado por Financeiro e Compras

## Fase 6 (concluída) — Estoque

- CRUD completo de Estoque (produto, quantidade, unidade, valor médio, observações)
- Um produto = uma linha por empresa (`UNIQUE(empresa_id, produto)`), evitando registros duplicados do mesmo material
- "Valor total em estoque" nunca é armazenado — calculado (`quantidade × valor_médio`), mesmo princípio já aplicado em Compras e Financeiro
- Módulo mais simples que os anteriores (sem relacionamentos com Obra/Cliente), por escolha deliberada — mantém fiel ao escopo original da fase

## Fase 7 (concluída) — Diário de Obra

- CRUD completo de registros de diário: Obra (vínculo obrigatório), Data, Clima, Observações, Fotos
- Upload de fotos **direto do navegador para o Supabase Storage** (o backend nunca recebe bytes de arquivo, só URLs públicas) — requer criar o bucket `diario-obra` manualmente, ver `docs/DEPLOY.md`
- Tela em formato de **feed de cards** (não tabela) — mais adequado à natureza de um diário/registro cronológico, com filtro por Obra
- Mesma proteção de integridade referencial: Obra com registros de diário vinculados não pode ser removida (409 amigável)

## 🎉 V1 (MVP) completa

Todos os 7 módulos do escopo original foram implementados: Login, Dashboard, Clientes, Obras, Financeiro, Compras, Estoque e Diário de Obra — cada um com CRUD completo, isolamento multi-tenant, validações de negócio e revisão técnica dedicada.

Veja `docs/DEPLOY.md` e `docs/DATABASE.md` para detalhes de implantação e esquema do banco.
