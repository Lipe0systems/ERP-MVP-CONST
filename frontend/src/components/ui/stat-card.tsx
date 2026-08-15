import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Cor = "brand" | "blue" | "green" | "purple" | "cyan" | "red";

/**
 * Card de indicador (versão compacta do KpiCard).
 *
 * Redesign: saíram o gradiente no valor, o ícone com gradiente + anel, o
 * glow colorido no hover e o blob decorativo desfocado no canto. Ficou o
 * mesmo tint discreto do resto do sistema, com o VALOR dominando o label.
 *
 * A API (label/value/icon/cor/hint/loading) foi preservada — quem usa este
 * componente não precisa mudar nada.
 */
const TINT: Record<Cor, string> = {
  brand: "tint-amber",
  blue: "tint-blue",
  green: "tint-green",
  purple: "tint-purple",
  cyan: "tint-blue",
  red: "tint-red",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  cor?: Cor;
  hint?: string;
  loading?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, cor = "brand", hint, loading, className }: StatCardProps) {
  return (
    <div className={cn("panel p-4", className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          TINT[cor]
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="t-label truncate">{label}</p>
          {loading ? (
            <div className="mt-1 h-6 w-24 animate-pulse rounded bg-muted" />
          ) : (
            <p className="t-value-sm truncate">{value}</p>
          )}
        </div>
      </div>
      {hint && !loading && <p className="mt-2 t-caption">{hint}</p>}
    </div>
  );
}
