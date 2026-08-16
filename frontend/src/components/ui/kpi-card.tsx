"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Tint = "amber" | "blue" | "green" | "purple" | "red" | "neutral";

interface KpiCardProps {
  label: string;
  valor: string;
  icon: LucideIcon;
  tint?: Tint;
  /** Variação percentual. Positivo = alta, negativo = baixa. Omitir esconde a linha. */
  variacao?: number | null;
  /** Texto de comparação, ex.: "vs. mês anterior". */
  comparacao?: string;
  /**
   * Quando true, uma variação NEGATIVA é boa (ex.: despesas caindo) e
   * aparece em verde. Sem isso, "despesa caiu 8%" apareceria em vermelho,
   * comunicando o oposto do que aconteceu.
   */
  inverterCor?: boolean;
  loading?: boolean;
}

// Gradiente escrito direto (mesmo motivo documentado em page-header.tsx e
// stat-card.tsx: as classes bg-grad-* foram redefinidas para cor sólida em
// outros 18 arquivos do redesign, então não são reaproveitadas aqui).
const GRAD_CLASS: Record<Tint, string> = {
  amber: "bg-gradient-to-br from-amber-500 to-orange-600",
  blue: "bg-gradient-to-br from-blue-500 to-indigo-600",
  green: "bg-gradient-to-br from-green-500 to-emerald-600",
  purple: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
  red: "bg-gradient-to-br from-red-500 to-rose-600",
  neutral: "bg-gradient-to-br from-slate-400 to-slate-500",
};
const RING_CLASS: Record<Tint, string> = {
  amber: "ring-amber-500/20", blue: "ring-blue-500/20", green: "ring-green-500/20",
  purple: "ring-purple-500/20", red: "ring-red-500/20", neutral: "ring-slate-400/20",
};

export function KpiCard({
  label, valor, icon: Icon, tint = "amber",
  variacao, comparacao = "vs. mês anterior", inverterCor = false, loading,
}: KpiCardProps) {
  const temVariacao = variacao !== undefined && variacao !== null;
  const subiu = (variacao ?? 0) >= 0;
  const positivo = inverterCor ? !subiu : subiu;
  const SetaIcon = subiu ? TrendingUp : TrendingDown;

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md ring-4",
          GRAD_CLASS[tint], RING_CLASS[tint]
        )}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="t-label truncate">{label}</p>
          {loading ? (
            <div className="mt-1 h-7 w-32 animate-pulse rounded bg-muted" />
          ) : (
            <p className="t-value truncate">{valor}</p>
          )}
        </div>
      </div>

      {temVariacao && !loading && (
        <div className="mt-3 flex items-center gap-1.5">
          <SetaIcon className={cn("h-3.5 w-3.5", positivo ? "text-emerald-500" : "text-red-500")} />
          <span className={cn("t-trend", positivo ? "text-emerald-500" : "text-red-500")}>
            {Math.abs(variacao).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
          </span>
          <span className="t-caption">{comparacao}</span>
        </div>
      )}
    </div>
  );
}
