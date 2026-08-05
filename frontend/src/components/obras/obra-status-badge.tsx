import { cn } from "@/lib/utils";
import { OBRA_STATUS_LABEL, type ObraStatus } from "@/types";

const STATUS_STYLES: Record<ObraStatus, string> = {
  planejamento: "bg-secondary text-secondary-foreground",
  em_andamento: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  pausada: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  concluida: "bg-green-500/15 text-green-600 dark:text-green-400",
  cancelada: "bg-destructive/15 text-destructive",
};

export function ObraStatusBadge({ status }: { status: ObraStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {OBRA_STATUS_LABEL[status]}
    </span>
  );
}
