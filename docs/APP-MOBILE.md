# App Mobile (iOS + Android) — Onseg Gestão

Guia de execução. O sistema web **não muda em nada** com isto — o app
carrega o site já publicado no Vercel (ver comentários explicativos em
`frontend/capacitor.config.ts`).

---

## 1. Instalar as dependências

Na pasta `frontend/`:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

## 2. Criar os projetos nativos

```bash
npx cap add ios
npx cap add android
```

Isso cria duas pastas novas: `ios/` e `android/`.
**Nenhum arquivo existente do Next.js é alterado.** O Vercel ignora essas
pastas — o deploy do site continua idêntico.

## 3. Sincronizar a configuração

Sempre que mudar o `capacitor.config.ts`:

```bash
npx cap sync
```

## 4. Abrir e testar

```bash
npx cap open android   # abre no Android Studio
npx cap open ios       # abre no Xcode (só funciona em Mac)
```

---

## Pré-requisitos que dependem de você

| Item | Necessário para | Custo |
|---|---|---|
| Android Studio | Compilar/testar Android | Grátis |
| Xcode + Mac | Compilar/testar iOS | Grátis (exige Mac) |
| Conta Google Play | Publicar Android | US$ 25 (uma vez) |
| Conta Apple Developer | Publicar iOS | US$ 99/ano |

**Não existe forma de compilar iOS sem um Mac.** É restrição da Apple,
não do Capacitor. Alternativas: Mac na nuvem (MacinCloud, ~US$25/mês) ou
serviços de build (Ionic Appflow, Codemagic).

---

## TESTE CRÍTICO — faça este primeiro

Antes de qualquer outra coisa, depois de rodar o app pela primeira vez:

1. Faça **login** dentro do app
2. **Feche o app completamente** (não só minimize)
3. **Abra de novo**

**Se continuar logado:** está tudo certo, nada mais precisa ser feito na
autenticação.

**Se voltar para a tela de login:** o WebView não está persistindo os
cookies de sessão do Supabase. Isso tem solução conhecida (trocar o
armazenamento de sessão por `@capacitor/preferences`), mas exige alterar
`src/lib/supabase/client.ts` — que é o arquivo mais sensível do sistema.
Reporte o resultado antes de mexer nele.

---

## Ícone e splash screen

Coloque uma imagem 1024×1024 e rode:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

Isso gera automaticamente todos os tamanhos que iOS e Android exigem.
A logo já disponível no projeto (`public/images/logo-icone.png`) pode
servir de base, mas as lojas exigem 1024×1024 sem transparência.

---

## Atualizações depois de publicado

Como o app carrega do Vercel:

- **Mudança no sistema (telas, regras, correções)** → deploy no Vercel,
  o app atualiza sozinho. **Sem nova revisão da loja.**
- **Mudança no `capacitor.config.ts`, ícone, ou permissões nativas** →
  aí sim exige `npx cap sync`, rebuild e envio para a loja.

Na prática, a grande maioria das atualizações cai no primeiro caso.
