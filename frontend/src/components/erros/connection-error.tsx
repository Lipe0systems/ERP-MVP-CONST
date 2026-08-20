"use client";

import { WifiOff } from "lucide-react";
import { ErrorPage } from "./error-page";

/**
 * Renderizado quando o fetch falha antes mesmo de chegar a uma resposta
 * HTTP (backend fora do ar, sem rede, CORS bloqueado) — situação diferente
 * de um erro 500 "normal", onde o servidor respondeu, só que com erro.
 *
 * Como distinguir na prática: uma falha de rede rejeita a Promise do
 * fetch() como TypeError ("Failed to fetch"), nunca chega a virar ApiError
 * (que só existe depois de uma resposta HTTP de verdade ser recebida).
 *
 *   try {
 *     await apiFetch(...)
 *   } catch (err) {
 *     if (err instanceof TypeError) → <ConnectionError onRetry={...} />
 *     else if (err instanceof ApiError && err.status === 403) → <Forbidden403 />
 *     else → erro genérico
 *   }
 */
export function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorPage
      icon={WifiOff}
      title="Não foi possível conectar ao servidor"
      description="Verifique sua conexão e tente novamente. Se o problema persistir, tente novamente em alguns instantes."
      cor="brand"
      primaryAction={{ label: "Tentar novamente", onClick: onRetry }}
      secondaryAction={{ label: "Ir para o Dashboard", href: "/dashboard" }}
    />
  );
}
