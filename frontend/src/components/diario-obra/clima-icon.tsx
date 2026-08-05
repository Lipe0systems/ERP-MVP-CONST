import { Cloud, CloudLightning, CloudRain, CloudSun, Sun } from "lucide-react";
import { CLIMA_OBRA_LABEL, type ClimaObra } from "@/types";
import { cn } from "@/lib/utils";

const CLIMA_ICON: Record<ClimaObra, typeof Sun> = {
  ensolarado: Sun,
  parcialmente_nublado: CloudSun,
  nublado: Cloud,
  chuvoso: CloudRain,
  tempestade: CloudLightning,
};

const CLIMA_COLOR: Record<ClimaObra, string> = {
  ensolarado: "text-amber-500",
  parcialmente_nublado: "text-amber-400",
  nublado: "text-muted-foreground",
  chuvoso: "text-blue-500",
  tempestade: "text-purple-500",
};

export function ClimaIcon({ clima, className }: { clima: ClimaObra; className?: string }) {
  const Icon = CLIMA_ICON[clima];
  return <Icon className={cn("h-4 w-4", CLIMA_COLOR[clima], className)} />;
}

export function ClimaBadge({ clima }: { clima: ClimaObra }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      <ClimaIcon clima={clima} />
      {CLIMA_OBRA_LABEL[clima]}
    </span>
  );
}
