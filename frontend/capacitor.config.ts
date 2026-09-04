import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuração do app nativo (iOS + Android).
 *
 * ARQUITETURA — por que `server.url` em vez de empacotar os arquivos:
 * Este projeto NÃO é um site estático. Ele depende de:
 *   • middleware.ts   → protege as rotas, roda no servidor
 *   • Server Components → renderizados no servidor
 *   • Rotas dinâmicas   → /obras/[id], /workspace/[id], etc.
 *
 * Empacotar os arquivos dentro do app exigiria `output: "export"` no
 * next.config.js, o que DESLIGA todas essas capacidades — na prática,
 * jogaria fora a proteção de rotas e a arquitetura atual.
 *
 * Por isso o app carrega o site já publicado no Vercel. Consequências:
 *   ✅ Deploy no Vercel atualiza o app instantaneamente, sem passar por
 *      nova revisão da Apple/Google.
 *   ✅ Autenticação, middleware e multi-tenant continuam funcionando
 *      exatamente como no navegador — mesmo código, mesmo servidor.
 *   ⚠️  Exige internet (o sistema já é assim hoje no navegador).
 */
const config: CapacitorConfig = {
  appId: "br.com.onseg.gestao",
  appName: "Onseg Gestão",
  // Pasta exigida pelo Capacitor mesmo no modo servidor: ele guarda aqui
  // um HTML mínimo de fallback, usado só se a URL estiver inacessível.
  webDir: "public",

  server: {
    url: "https://onseggest.vercel.app",
    // Sem isto, o WebView bloquearia a navegação para o domínio externo.
    allowNavigation: ["onseggest.vercel.app", "*.supabase.co"],
    // HTTPS obrigatório: o Supabase Auth recusa cookies de sessão em
    // conexão não segura, e as lojas exigem tráfego criptografado.
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
  },

  ios: {
    // Evita que o conteúdo fique embaixo do "notch"/barra de status.
    contentInset: "always",
  },

  android: {
    // Bloqueia HTTP puro — reforça a mesma regra do server.cleartext.
    allowMixedContent: false,
  },
};

export default config;
