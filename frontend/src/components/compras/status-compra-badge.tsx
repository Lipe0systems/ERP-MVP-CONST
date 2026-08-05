import { cn } from "@/lib/utils";
import type { StatusCompra } from "@/types";

const STATUS_STYLES: Record<StatusCompra, string> = {
  pendente: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  aprovada: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  recebida: "bg-green-500/15 text-green-600 dark:text-green-400",
  cancelada: "bg-destructive/15 text-destructive",
};

const STATUS_LABEL: Record<StatusCompra, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  recebida: "Recebida",
  cancelada: "Cancelada",
};

export function StatusCompraBadge({ status }: { status: StatusCompra }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
