import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Cor = "brand" | "blue" | "green" | "purple" | "cyan" | "red";

/**
 * Cabeçalho padrão das páginas.
 *
 * Redesign: o ícone deixou de ser um quadrado com gradiente + sombra +
 * anel colorido (que aparecia em TODAS as páginas do sistema, brigando com
 * "laranja é acento" e enchendo a interface de cor) e virou o mesmo tint
 * discreto usado nos KPIs — fundo suave a 12% e ícone colorido.
 *
 * A prop `cor` foi mantida para não quebrar as ~20 páginas que a usam;
 * só o resultado visual mudou.
 */
const TINT: Record<Cor, string> = {
  brand: "tint-amber",
  blue: "tint-blue",
  green: "tint-green",
  purple: "tint-purple",
  cyan: "tint-blue",
  red: "tint-red",
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
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          TINT[cor]
        )}>
          <Icon className="h-[18px] w-[18px]" />
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
