const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
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
