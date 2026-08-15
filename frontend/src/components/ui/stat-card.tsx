import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Cor = "brand" | "blue" | "green" | "purple" | "cyan" | "red";

const CONFIG: Record<Cor, { grad: string; glow: string; iconBg: string; text: string; ring: string }> = {
  brand:  { grad: "bg-grad-brand",  glow: "hover:glow-brand",  iconBg: "bg-grad-brand",  text: "text-gradient-brand",  ring: "ring-amber-500/20" },
  blue:   { grad: "bg-grad-blue",   glow: "hover:glow-blue",   iconBg: "bg-grad-blue",   text: "text-gradient-blue",   ring: "ring-blue-500/20" },
  green:  { grad: "bg-grad-green",  glow: "hover:glow-green",  iconBg: "bg-grad-green",  text: "text-gradient-green",  ring: "ring-green-500/20" },
  purple: { grad: "bg-grad-purple", glow: "hover:glow-purple", iconBg: "bg-grad-purple", text: "text-gradient-purple", ring: "ring-purple-500/20" },
  cyan:   { grad: "bg-grad-cyan",   glow: "hover:glow-blue",   iconBg: "bg-grad-cyan",   text: "text-gradient-blue",   ring: "ring-cyan-500/20" },
  red:    { grad: "bg-grad-brand",  glow: "hover:glow-brand",  iconBg: "bg-gradient-to-br from-red-500 to-rose-600", text: "text-red-600", ring: "ring-red-500/20" },
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
  const c = CONFIG[cor];
  return (
    <div className={cn(
      "card-vivid group relative overflow-hidden rounded-2xl p-5",
      c.glow,
      className
    )}>
      {/* Blob decorativo no canto */}
      <div className={cn(
        "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-20",
        c.grad
      )} />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 rounded-lg shimmer" />
          ) : (
            <p className={cn("mt-1.5 text-3xl font-bold tabular-nums tracking-tight", c.text)}>
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
          )}
        </div>

        {/* Ícone em cápsula com gradiente + glow */}
        <div className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg ring-4",
          c.iconBg, c.ring
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
