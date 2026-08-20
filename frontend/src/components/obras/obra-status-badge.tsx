import { cn } from "@/lib/utils";
import { OBRA_STATUS_LABEL, type ObraStatus } from "@/types";

const STATUS_STYLES: Record<ObraStatus, string> = {
  planejamento: "badge-neutral",
  em_andamento: "badge-info",
  pausada: "badge-warning",
  concluida: "badge-success",
  cancelada: "badge-danger",
};

export function ObraStatusBadge({ status }: { status: ObraStatus }) {
  return (
    <span
      className={cn(
        "badge-status",
        STATUS_STYLES[status]
      )}
    >
      {OBRA_STATUS_LABEL[status]}
    </span>
  );
}
