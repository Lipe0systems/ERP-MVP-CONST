"use client";

import { cn } from "@/lib/utils";

/* ── Badge de status ────────────────────────────────────────────────────────
   Na referência os badges são discretos: fundo tingido a ~12%, texto na cor,
   sem borda e sem gradiente. Cada status tem um tom semântico fixo, então a
   cor comunica significado em vez de ser decoração.                          */

type BadgeTom = "neutral" | "info" | "success" | "warning" | "danger";

const TOM_CLASS: Record<BadgeTom, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-500/12 text-blue-500 dark:text-blue-400",
  success: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/12 text-red-500 dark:text-red-400",
};

export function StatusBadge({ children, tom = "neutral", className }: {
  children: React.ReactNode; tom?: BadgeTom; className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
      TOM_CLASS[tom], className
    )}>
      {children}
    </span>
  );
}

/* ── Barra de progresso ─────────────────────────────────────────────────────
   Fina, cantos arredondados, laranja sobre trilho neutro — como nas linhas
   de "Obras em andamento" da referência.                                     */

export function ProgressBar({ valor, className }: { valor: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, valor));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Cabeçalho de painel ────────────────────────────────────────────────────
   Título à esquerda, ação opcional à direita ("Ver todas"), como em todos os
   blocos da referência.                                                      */

export function PanelHeader({ titulo, acao, className }: {
  titulo: string; acao?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pt-5", className)}>
      <h2 className="t-section">{titulo}</h2>
      {acao}
    </div>
  );
}
