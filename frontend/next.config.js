const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Tree-shaking agressivo das bibliotecas que mais pesam no bundle.
   *
   * lucide-react: sem isto, importar 5 ícones podia arrastar o índice
   * inteiro do pacote no bundle de desenvolvimento e atrapalhar o
   * tree-shaking em produção. O projeto usa 104 ícones distintos em 75
   * arquivos, então o ganho aqui é real.
   *
   * recharts e date-fns: mesmo princípio — só o que é efetivamente
   * importado entra no bundle final.
   *
   * Não altera nenhum componente: é transformação de import feita pelo
   * compilador, o código-fonte continua idêntico.
   */
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    // Formatos modernos: reduzem bastante o peso das imagens (hero do
    // login, logos) sem perda visível de qualidade.
    formats: ["image/avif", "image/webp"],
  },

  // Remove os console.* do bundle de produção (mantém error/warn, que são
  // úteis para diagnóstico real em produção).
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Silencia os logs de build do Sentry (sourcemap upload, etc.) — só
  // aparecem se algo der errado. Sem organização/projeto configurados via
  // env, o upload de sourcemap é pulado automaticamente (não quebra o build).
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  disableLogger: true,
});
