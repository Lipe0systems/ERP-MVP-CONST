import * as Sentry from "@sentry/nextjs";

// Vazio em desenvolvimento local (Sentry só reporta quando a variável de
// ambiente está configurada no Vercel) — nunca hardcoded no código.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Amostra baixa de performance — o objetivo é capturar ERROS, não
    // rastrear toda navegação em detalhe (economiza a cota gratuita).
    tracesSampleRate: 0.1,
    // Não grava sessão de tela por padrão — pode ativar depois se quiser
    // "replay" de bugs visuais, mas consome cota mais rápido.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
