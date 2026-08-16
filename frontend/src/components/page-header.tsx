import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Cor = "brand" | "blue" | "green" | "purple" | "cyan" | "red";

// Gradiente escrito direto aqui (não usa as classes bg-grad-*): elas foram
// redefinidas para cor sólida durante o redesign e afetam 18 arquivos do
// sistema — mudar o significado delas de novo bagunçaria tudo mais. Aqui,
// só estes dois ícones (PageHeader + StatCard) voltam ao visual Vivid.
const GRAD: Record<Cor, string> = {
  brand: "bg-gradient-to-br from-amber-500 to-orange-600",
  blue: "bg-gradient-to-br from-blue-500 to-indigo-600",
  green: "bg-gradient-to-br from-green-500 to-emerald-600",
  purple: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
  cyan: "bg-gradient-to-br from-cyan-500 to-blue-600",
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
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ring-4",
          GRAD[cor], RING[cor]
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="t-page-title">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
