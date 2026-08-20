"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ErrorPage } from "@/components/erros/error-page";
import "./globals.css";

/**
 * Convenção especial do App Router: só entra em ação se o LAYOUT RAIZ (não
 * uma página específica) lançar uma exceção — cenário em que o error.tsx
 * normal não consegue ajudar, porque ele próprio vive dentro do layout que
 * quebrou. Por isso precisa das próprias tags <html>/<body>: está
 * substituindo a árvore inteira, não só o conteúdo.
 *
 * Não depende do ThemeProvider (pode ser justamente o que falhou) — por
 * isso não há garantia de refletir o tema claro/escuro que a pessoa tinha
 * escolhido; isso é um trade-off aceitável para uma tela de último recurso,
 * que só aparece se algo bem fundamental quebrar.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro crítico no layout raiz:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <ErrorPage
          icon={AlertTriangle}
          title="Algo deu errado"
          description="Não conseguimos concluir esta solicitação. Tente novamente em alguns instantes."
          cor="red"
          primaryAction={{ label: "Tentar novamente", onClick: reset }}
          secondaryAction={{ label: "Ir para o Dashboard", href: "/dashboard" }}
        />
      </body>
    </html>
  );
}
