import { cn } from "@/lib/utils";
import type { StatusOrcamento } from "@/types";
import { STATUS_ORCAMENTO_LABEL } from "@/types";

const COLORS: Record<StatusOrcamento, string> = {
  rascunho: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  aprovado: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  recusado: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelado: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

export function OrcamentoStatusBadge({ status }: { status: StatusOrcamento }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        COLORS[status]
      )}
    >
      {STATUS_ORCAMENTO_LABEL[status]}
    </span>
  );
}
