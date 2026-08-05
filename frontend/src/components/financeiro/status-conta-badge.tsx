import { cn } from "@/lib/utils";
import { getLocalISODate } from "@/lib/format";
import type { StatusConta } from "@/types";

interface StatusContaBadgeProps {
  status: StatusConta;
  dataVencimento: string;
  contexto: "pagar" | "receber";
}

const LABEL_LIQUIDADO: Record<"pagar" | "receber", string> = {
  pagar: "Pago",
  receber: "Recebido",
};

/**
 * "Atrasado" é calculado aqui (mesma regra do backend: pendente + vencimento
 * no passado), nunca armazenado — evita que o badge fique desatualizado.
 */
export function StatusContaBadge({ status, dataVencimento, contexto }: StatusContaBadgeProps) {
  const hoje = getLocalISODate();
  const atrasado = status === "pendente" && dataVencimento < hoje;

  if (atrasado) {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
        Atrasado
      </span>
    );
  }

  const styles: Record<StatusConta, string> = {
    pendente: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    liquidado: "bg-green-500/15 text-green-600 dark:text-green-400",
    cancelado: "bg-secondary text-secondary-foreground",
  };

  const labels: Record<StatusConta, string> = {
    pendente: "Pendente",
    liquidado: LABEL_LIQUIDADO[contexto],
    cancelado: "Cancelado",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
