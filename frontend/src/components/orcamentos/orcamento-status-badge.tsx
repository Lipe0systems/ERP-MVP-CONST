import { cn } from "@/lib/utils";
import type { StatusOrcamento } from "@/types";
import { STATUS_ORCAMENTO_LABEL } from "@/types";

// Usa o sistema global de badges (globals.css) em vez de cores fixas do
// Tailwind, que ficavam opacas contra o fundo navy.
const COLORS: Record<StatusOrcamento, string> = {
  rascunho: "badge-neutral",
  aprovado: "badge-success",
  recusado: "badge-danger",
  cancelado: "badge-warning",
};

export function OrcamentoStatusBadge({ status }: { status: StatusOrcamento }) {
  return (
    <span
      className={cn(
        "badge-status",
        COLORS[status]
      )}
    >
      {STATUS_ORCAMENTO_LABEL[status]}
    </span>
  );
}
