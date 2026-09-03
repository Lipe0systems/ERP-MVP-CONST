"use client";

// AlertTriangle e RefreshCw: ícones que o projeto JÁ usa em outros
// lugares — a regra do projeto é nunca introduzir ícone novo.
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Estado de erro de um widget do Dashboard.
 *
 * POR QUE ISSO EXISTE
 * Antes, quando a query de um widget falhava, o código caía no fallback
 * `data?.lucro ?? 0` e a tela exibia "R$ 0,00" — indistinguível de um
 * valor real. Alguém poderia olhar o dashboard, ver zeros e concluir que
 * o mês foi ruim, quando na verdade a API não respondeu. Um erro visível
 * é muito melhor que um número errado com cara de verdade.
 *
 * O widget falha SOZINHO: o resto do dashboard continua funcionando
 * normalmente, sem bloqueio de tela inteira.
 */
export function WidgetErro({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <AlertTriangle className="h-6 w-6 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">Não foi possível carregar</p>
      <p className="text-xs text-muted-foreground">
        Os dados deste bloco não puderam ser obtidos agora.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <RefreshCw className="h-3 w-3" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
