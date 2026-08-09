import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Cor = "brand" | "blue" | "green" | "purple" | "cyan" | "red";

const GRAD: Record<Cor, string> = {
  brand: "bg-grad-brand",
  blue: "bg-grad-blue",
  green: "bg-grad-green",
  purple: "bg-grad-purple",
  cyan: "bg-grad-cyan",
  red: "bg-gradient-to-br from-red-500 to-rose-600",
};

const RING: Record<Cor, string> = {
  brand: "ring-amber-500/20",
  blue: "ring-blue-500/20",
  green: "ring-green-500/20",
  purple: "ring-purple-500/20",
  cyan: "ring-cyan-500/20",
  red: "ring-red-500/20",
};

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  cor?: Cor;
  children?: React.ReactNode; // ações à direita
}

export function PageHeader({ icon: Icon, title, subtitle, cor = "brand", children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <div className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ring-4",
          GRAD[cor], RING[cor]
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
