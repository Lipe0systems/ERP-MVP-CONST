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
const KPI_COR: Record<Tint, string> = {
  amber: "kpi-amber",
  blue: "kpi-blue",
  green: "kpi-green",
  purple: "kpi-purple",
  red: "kpi-red",
  neutral: "kpi-blue",
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
    // kpi-vivid: fundo com tint da cor + borda esquerda acentuada + glow,
    // como na referência. A cor vem da classe kpi-* (variável CSS).
    <div className={cn("kpi-vivid p-5", KPI_COR[tint])}>
      <div className="flex items-center gap-3">
        {/* O ÍCONE em si não muda — só o container ganha o tratamento
            Vivid (fundo tingido, borda e glow). Regra do projeto. */}
        <div className="icon-vivid h-10 w-10 shrink-0">
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
