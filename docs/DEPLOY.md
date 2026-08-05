# Guia de Deploy — passo a passo

Ordem recomendada: **GitHub → Supabase → Backend (Render) → Frontend (Vercel) → primeira empresa/usuário → checklist de testes**.

---

## 0. Pré-requisitos

- Conta no [GitHub](https://github.com), [Supabase](https://supabase.com), [Render](https://render.com) e [Vercel](https://vercel.com) (todas têm plano gratuito suficiente para este MVP)
- O código do projeto (pasta `erp-construtoras/` com `frontend/`, `backend/`, `docs/`)

---

## 1. Subir o código para o GitHub

```bash
cd erp-construtoras
git init
git add .
git commit -m "ERP Construtoras - V1 completa"
```

No GitHub, crie um repositório novo (vazio, sem README) e depois:

```bash
git remote add origin https://github.com/SEU_USUARIO/erp-construtoras.git
git branch -M main
git push -u origin main
```

> Os `.gitignore` de `frontend/` e `backend/` já excluem `node_modules`, `.env`, `venv/` etc. — nada sensível vai para o repositório.

---

## 2. Supabase — banco, autenticação e storage

### 2.1 Criar o projeto

1. Em [supabase.com](https://supabase.com) → **New project**
2. Escolha nome, senha do banco (guarde essa senha — vai precisar dela na connection string) e região (escolha a mais próxima dos seus usuários, ex.: `South America (São Paulo)`)
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

Guarde esses valores num bloco de notas — você vai colá-los no Render e na Vercel daqui a pouco.

### 2.3 Rodar as migrations

Da sua máquina (precisa do Python do backend instalado):

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edite o .env recém-criado e cole o DATABASE_URL + demais chaves do passo 2.2
alembic upgrade head
```

Isso cria as 8 tabelas (`empresas`, `usuarios`, `clientes`, `obras`, `contas_pagar`, `contas_receber`, `compras`, `estoque`, `diario_obra`). Confira em **Table Editor** no painel do Supabase se elas apareceram.

### 2.4 Configurar autenticação (Auth)

Em **Authentication → URL Configuration**:
- **Site URL**: coloque provisoriamente `http://localhost:3000` (você troca pela URL real da Vercel no passo 4.3)
- **Redirect URLs**: adicione `http://localhost:3000/**` (e depois a URL da Vercel)

Em **Authentication → Providers → Email**: mantenha **Confirm email** desligado por enquanto (mais simples para os primeiros testes) — pode reativar depois.

### 2.5 Criar o bucket de fotos do Diário de Obra

1. **Storage → New bucket** → nome exatamente `diario-obra` → marque **Public bucket**
2. **Storage → Policies** → adicione as duas políticas abaixo (via SQL Editor é mais rápido que a UI):

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

1. **New → Web Service** → conecte o repositório do GitHub
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
   | `ALLOWED_ORIGINS` | por ora, `http://localhost:3000` (você atualiza no passo 4.3) |

7. **Create Web Service** e aguarde o build/deploy
8. Ao terminar, teste: abra `https://SEU-BACKEND.onrender.com/docs` — deve aparecer o Swagger da API
9. Guarde a URL pública do backend (ex.: `https://erp-construtoras-api.onrender.com`)

> Plano gratuito do Render "dorme" após inatividade — a primeira requisição depois de um tempo parado pode demorar ~30s para acordar. Normal para MVP/demo.

---

## 4. Frontend — Vercel

1. **Add New → Project** → importe o repositório do GitHub
2. **Root Directory**: `frontend`
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

Agora que você tem a URL final da Vercel, volte e atualize:

- **Render → Environment → `ALLOWED_ORIGINS`**: troque para a URL da Vercel (ex.: `https://erp-construtoras.vercel.app`) e clique em **Manual Deploy → Deploy latest commit** para aplicar
- **Supabase → Authentication → URL Configuration**: troque **Site URL** e **Redirect URLs** para a URL da Vercel

---

## 5. Criar a primeira empresa e usuário

O projeto não tem uma tela de "criar conta/empresa" (não fazia parte do escopo da V1) — o primeiro acesso é feito manualmente, uma única vez:

### 5.1 Criar o usuário no Supabase Auth

**Authentication → Users → Add user → Create new user**: preencha e-mail e senha, marque **Auto Confirm User**.

### 5.2 Criar a empresa no banco

No **SQL Editor** do Supabase:

```sql
insert into empresas (id, nome, cnpj, ativo, criado_em)
values (gen_random_uuid(), 'Sua Construtora Ltda', '00000000000100', true, now())
returning id;
```

Copie o `id` retornado — é o `empresa_id`.

### 5.3 Vincular o usuário à empresa

O backend lê `empresa_id` do `user_metadata` (ou `app_metadata`) do token JWT do Supabase Auth. Defina isso em **Authentication → Users → [seu usuário] → User Metadata**, editando o JSON para:

```json
{
  "empresa_id": "COLE_AQUI_O_ID_DA_EMPRESA_DO_PASSO_5.2"
}
```

### 5.4 (Opcional) Espelhar o usuário na tabela `usuarios`

Não é estritamente necessário para o login funcionar (a autenticação em si é 100% Supabase Auth), mas mantém a tabela `usuarios` coerente com o Auth:

```sql
insert into usuarios (id, empresa_id, nome, email, papel, ativo, criado_em)
values (
  'COLE_AQUI_O_ID_DO_USUARIO_NO_AUTH',  -- Authentication → Users → copie o UUID do usuário
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

1. Acesse a URL da Vercel → deve redirecionar para `/login`
2. Faça login com o e-mail/senha criados no passo 5.1 → deve cair no `/dashboard`
3. Dashboard carrega sem erro (cards zerados é esperado, ainda não há dados)
4. Cadastre um Cliente → aparece na listagem
5. Cadastre uma Obra vinculada a esse Cliente → aparece na listagem
6. Cadastre uma Conta a Pagar/Receber → confira que os totais do Dashboard mudam
7. Cadastre uma Compra e um item de Estoque
8. Cadastre um registro de Diário de Obra **com foto** → confirme que a foto aparece no card (valida o bucket do passo 2.5)
9. Tente excluir a Obra usada nos passos acima → deve dar erro 409 amigável ("possui registros vinculados"), não 500

Se todos os 9 passos passarem, o deploy está funcional de ponta a ponta.

---

## 7. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Login funciona mas todas as telas dão erro 400 "empresa vinculada" | `user_metadata.empresa_id` não foi definido | Repita o passo 5.3 |
| Erro de CORS no console do navegador | `ALLOWED_ORIGINS` no Render não bate com a URL da Vercel | Repita o passo 4.1 |
| Upload de foto falha | Bucket `diario-obra` não existe ou está sem policy | Repita o passo 2.5 |
| Backend demora ~30s na primeira requisição | Plano gratuito do Render hiberna após inatividade | Normal — considere um plano pago para produção real |
| `alembic upgrade head` falha com erro de conexão | `DATABASE_URL` incorreta ou senha do banco errada | Confira o passo 2.2, a senha é a que você definiu ao criar o projeto Supabase |

Nenhuma dependência local é necessária em produção — toda a configuração acontece por variáveis de ambiente.
