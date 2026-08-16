import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Cor = "brand" | "blue" | "green" | "purple" | "cyan" | "red";

// Gradiente escrito direto (não usa as classes bg-grad-*, redefinidas para
// cor sólida em outros 18 arquivos do redesign — ver mesmo comentário em
// page-header.tsx).
const GRAD: Record<Cor, string> = {
  brand: "bg-gradient-to-br from-amber-500 to-orange-600",
  blue: "bg-gradient-to-br from-blue-500 to-indigo-600",
  green: "bg-gradient-to-br from-green-500 to-emerald-600",
  purple: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
  cyan: "bg-gradient-to-br from-cyan-500 to-blue-600",
  red: "bg-gradient-to-br from-red-500 to-rose-600",
};
const RING: Record<Cor, string> = {
  brand: "ring-amber-500/20", blue: "ring-blue-500/20", green: "ring-green-500/20",
  purple: "ring-purple-500/20", cyan: "ring-cyan-500/20", red: "ring-red-500/20",
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
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md ring-4",
          GRAD[cor], RING[cor]
        )}>
          <Icon className="h-[18px] w-[18px]" />
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
