"use client";

import { cn } from "@/lib/utils";

const OPCOES = [
  { dias: 30, label: "30 dias" },
  { dias: 60, label: "60 dias" },
  { dias: 90, label: "90 dias" },
  { dias: 180, label: "6 meses" },
  { dias: 365, label: "1 ano" },
];

interface Props {
  value: number;
  onChange: (dias: number) => void;
  className?: string;
}

export function PeriodoSelect({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex gap-1 rounded-lg border bg-muted/40 p-1", className)}>
      {OPCOES.map((o) => {
        const ativo = value === o.dias;
        return (
          <button
            key={o.dias}
            onClick={() => onChange(o.dias)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-100",
              ativo ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
