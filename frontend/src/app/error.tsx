"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ErrorPage } from "@/components/erros/error-page";

/**
 * Error Boundary do App Router (convenção do Next.js: error.tsx captura
 * qualquer exceção não tratada nos componentes abaixo dele na árvore).
 * `error` e `reset` são injetados automaticamente pelo Next — reset()
 * tenta re-renderizar a árvore sem recarregar a página inteira.
 *
 * SEGURANÇA: o objeto `error` pode conter stack trace, mensagens do
 * FastAPI/Postgres ou qualquer detalhe interno que vazou até aqui. Por
 * isso ele só vai para o console (nunca para o texto exibido ao usuário)
 * — e mesmo isso, tipicamente redirecionado ao Sentry em produção, não
 * exposto na tela.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro não tratado capturado pelo Error Boundary:", error);
  }, [error]);

  return (
    <ErrorPage
      icon={AlertTriangle}
      title="Algo deu errado"
      description="Não conseguimos concluir esta solicitação. Tente novamente em alguns instantes."
      cor="red"
      primaryAction={{ label: "Tentar novamente", onClick: reset }}
      secondaryAction={{ label: "Ir para o Dashboard", href: "/dashboard" }}
    />
  );
}
