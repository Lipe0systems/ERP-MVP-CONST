# Guia de Deploy — 100% pelo navegador (sem terminal)

Nenhum passo abaixo exige linha de comando, Python ou Node instalado na sua
máquina — tudo é feito pelo painel do GitHub, Supabase, Render e Vercel.

Ordem: **GitHub → Supabase → Backend (Render) → Frontend (Vercel) → primeira empresa/usuário → checklist de testes**.

---

## 0. Pré-requisitos

- Conta no [GitHub](https://github.com), [Supabase](https://supabase.com), [Render](https://render.com) e [Vercel](https://vercel.com) — todas gratuitas para este MVP
- A pasta `erp-construtoras/` descompactada no seu computador (baixe e extraia o `.zip`)

---

## 1. Subir o código para o GitHub (sem git, só upload)

1. Acesse [github.com/new](https://github.com/new), dê um nome ao repositório (ex.: `erp-construtoras`) e clique em **Create repository** — deixe **sem** README/gitignore (repositório vazio)
2. Na página do repositório recém-criado, clique no link **"uploading an existing file"**
3. No seu computador, abra a pasta `erp-construtoras/` extraída e **arraste as pastas `frontend/`, `backend/`, `docs/` e o arquivo `README.md` inteiros** para a área de upload do GitHub (o Chrome preserva a estrutura de subpastas ao arrastar)
4. Role até o fim da página, escreva uma mensagem tipo "ERP Construtoras - V1" e clique em **Commit changes**

> Se o navegador travar por causa do tamanho (pouco provável, o projeto é só código-fonte), suba `frontend/` e `backend/` em dois uploads separados — o resultado final é o mesmo.

> Os arquivos `.gitignore` já existentes nas pastas não têm efeito no upload manual (esse mecanismo é só do `git` via linha de comando) — mas como o projeto não tem `node_modules/`, `.env` nem `venv/` reais (só os `.example`), não há nada sensível para vazar.

---

## 2. Supabase — banco, autenticação e storage

### 2.1 Criar o projeto

1. Em [supabase.com](https://supabase.com) → **New project**
2. Escolha nome, senha do banco (guarde essa senha) e região (ex.: `South America (São Paulo)`)
3. Aguarde ~2 minutos até o projeto ficar pronto

### 2.2 Coletar as credenciais

No painel do projeto:

| Onde encontrar | Variável |
|---|---|
| **Project Settings → Database → Connection string → URI** | `DATABASE_URL` |
| **Project Settings → API → Project URL** | `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` |
| **Project Settings → API → Project API keys → anon public** | `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Project Settings → API → Project API keys → service_role** | `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha no frontend) |
| **Project Settings → API → JWT Settings → JWT Secret** | `SUPABASE_JWT_SECRET` |

Cole esses valores num bloco de notas — você vai usá-los no Render e na Vercel.

### 2.3 Criar as tabelas (sem alembic — via SQL Editor)

Como você não tem Python localmente para rodar `alembic upgrade head`, use o SQL pronto:

1. No painel do Supabase, abra **SQL Editor → New query**
2. Abra o arquivo `docs/schema.sql` (está na pasta do projeto) num editor de texto, copie **todo o conteúdo**
3. Cole no SQL Editor do Supabase e clique em **Run**
4. Confira em **Table Editor** se as 9 tabelas apareceram (`empresas`, `usuarios`, `clientes`, `obras`, `contas_pagar`, `contas_receber`, `compras`, `estoque`, `diario_obra`)

Esse script SQL é equivalente às 7 migrations do projeto — mesmas colunas, tipos, chaves estrangeiras e índices.

### 2.4 Configurar autenticação (Auth)

Em **Authentication → URL Configuration**:
- **Site URL**: coloque provisoriamente `http://localhost:3000` (você troca pela URL real da Vercel no passo 4.1)
- **Redirect URLs**: adicione `http://localhost:3000/**`

Em **Authentication → Providers → Email**: desligue **Confirm email** por enquanto (mais simples para os primeiros testes).

### 2.5 Criar o bucket de fotos do Diário de Obra

1. **Storage → New bucket** → nome exatamente `diario-obra` → marque **Public bucket**
2. **SQL Editor → New query**, cole e rode:

```sql
create policy "Usuários autenticados podem enviar fotos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'diario-obra');

create policy "Usuários autenticados podem remover fotos"
on storage.objects for delete
to authenticated
using (bucket_id = 'diario-obra');
```

---

## 3. Backend — Render

1. Em [render.com](https://render.com) → **New → Web Service** → conecte sua conta do GitHub e escolha o repositório `erp-construtoras`
2. **Root Directory**: `backend`
3. **Runtime**: Python 3
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Em **Environment**, adicione as variáveis (valores do passo 2.2):

   | Chave | Valor |
   |---|---|
   | `ENVIRONMENT` | `production` |
   | `DATABASE_URL` | connection string do Supabase |
   | `SUPABASE_URL` | URL do projeto Supabase |
   | `SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service role key |
   | `SUPABASE_JWT_SECRET` | JWT secret |
   | `ALLOWED_ORIGINS` | por ora, `http://localhost:3000` (atualiza no passo 4.1) |

7. **Create Web Service** e aguarde o build/deploy (acompanhe pelos logs na própria página, tudo pelo navegador)
8. Ao terminar, abra `https://SEU-BACKEND.onrender.com/docs` — deve aparecer o Swagger da API
9. Guarde a URL pública do backend (ex.: `https://erp-construtoras-api.onrender.com`)

> Plano gratuito do Render "dorme" após inatividade — a primeira requisição depois de um tempo parado pode demorar ~30s para acordar. Normal para MVP/demo.

---

## 4. Frontend — Vercel

1. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório `erp-construtoras` do GitHub
2. **Root Directory**: `frontend` (a Vercel pergunta isso na tela de configuração antes do deploy)
3. Framework preset: Next.js (detectado automaticamente)
4. Em **Environment Variables**, adicione:

   | Chave | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `NEXT_PUBLIC_API_URL` | URL do backend no Render **+ `/api/v1`** (ex.: `https://erp-construtoras-api.onrender.com/api/v1`) |

5. **Deploy** e aguarde
6. Guarde a URL pública do frontend (ex.: `https://erp-construtoras.vercel.app`)

### 4.1 Fechar o círculo: atualizar CORS e Auth com a URL real

Agora que você tem a URL final da Vercel, volte e atualize (ambos pelo navegador, sem redeploy manual — só salvar já reinicia):

- **Render → seu serviço → Environment → `ALLOWED_ORIGINS`**: troque para a URL da Vercel (ex.: `https://erp-construtoras.vercel.app`), salve, e clique em **Manual Deploy → Deploy latest commit**
- **Supabase → Authentication → URL Configuration**: troque **Site URL** e **Redirect URLs** para a URL da Vercel

---

## 5. Criar a primeira empresa e usuário

O projeto não tem uma tela de "criar conta/empresa" (fora do escopo da V1) — o primeiro acesso é feito manualmente, uma única vez, pelo painel do Supabase.

### 5.1 Criar o usuário no Supabase Auth

**Authentication → Users → Add user → Create new user**: preencha e-mail e senha, marque **Auto Confirm User**.

### 5.2 Criar a empresa no banco

**SQL Editor → New query**:

```sql
insert into empresas (id, nome, cnpj, ativo, criado_em)
values (gen_random_uuid(), 'Sua Construtora Ltda', '00000000000100', true, now())
returning id;
```

Copie o `id` retornado na tela de resultado — é o `empresa_id`.

### 5.3 Vincular o usuário à empresa

O backend lê `empresa_id` do `user_metadata` do token JWT do Supabase Auth. Em **Authentication → Users → clique no seu usuário → User Metadata**, edite o JSON para:

```json
{
  "empresa_id": "COLE_AQUI_O_ID_DA_EMPRESA_DO_PASSO_5.2"
}
```

### 5.4 (Opcional) Espelhar o usuário na tabela `usuarios`

**SQL Editor → New query** (pegue o UUID do usuário em **Authentication → Users**, coluna "UID"):

```sql
insert into usuarios (id, empresa_id, nome, email, papel, ativo, criado_em)
values (
  'COLE_AQUI_O_UID_DO_USUARIO_NO_AUTH',
  'COLE_AQUI_O_ID_DA_EMPRESA',
  'Seu Nome',
  'seu@email.com',
  'admin',
  true,
  now()
);
```

---

## 6. Checklist de testes (fumaça)

Tudo pelo navegador, na URL da Vercel:

1. Acessar a URL → deve redirecionar para `/login`
2. Login com o e-mail/senha do passo 5.1 → deve cair no `/dashboard`
3. Dashboard carrega sem erro (cards zerados é esperado, ainda não há dados)
4. Cadastrar um Cliente → aparece na listagem
5. Cadastrar uma Obra vinculada a esse Cliente → aparece na listagem
6. Cadastrar uma Conta a Pagar/Receber → conferir que os totais do Dashboard mudam
7. Cadastrar uma Compra e um item de Estoque
8. Cadastrar um registro de Diário de Obra **com foto** → a foto deve aparecer no card (valida o bucket do passo 2.5)
9. Tentar excluir a Obra usada nos passos acima → deve dar erro 409 amigável ("possui registros vinculados"), não uma tela de erro genérica

Se os 9 passos passarem, o deploy está funcional de ponta a ponta.

---

## 7. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Login funciona mas todas as telas dão erro "empresa vinculada" | `user_metadata.empresa_id` não foi definido | Repita o passo 5.3 |
| Erro de CORS no console do navegador (F12) | `ALLOWED_ORIGINS` no Render não bate com a URL da Vercel | Repita o passo 4.1 |
| Upload de foto falha | Bucket `diario-obra` não existe ou está sem as policies | Repita o passo 2.5 |
| Backend demora ~30s na primeira requisição | Plano gratuito do Render hiberna após inatividade | Normal — considere um plano pago para produção real |
| `docs/schema.sql` dá erro "relation already exists" | Você já rodou o script antes (ou parte dele) | Normal se for reexecução; se for a 1ª vez, confira se copiou o arquivo inteiro |

Nenhuma dependência local é necessária em produção — toda a configuração acontece pelos painéis web.
