"use client";

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Package, HardHat, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useResultadoObra } from "@/hooks/use-obras";
import { formatMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

const SAUDE_CONFIG = {
  dentro_orcamento: { label: "Dentro do orçamento", cor: "text-green-600", bg: "bg-green-500/10", icone: CheckCircle2 },
  atencao: { label: "Atenção — orçamento quase no limite", cor: "text-amber-600", bg: "bg-amber-500/10", icone: AlertTriangle },
  acima_orcamento: { label: "Acima do orçamento", cor: "text-red-600", bg: "bg-red-500/10", icone: AlertTriangle },
} as const;

export function ResultadoObraCard({ obraId }: { obraId: string }) {
  const { data, isLoading } = useResultadoObra(obraId);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  if (!data) return null;

  const saude = SAUDE_CONFIG[data.saude];
  const SaudeIcone = saude.icone;
  const margemPositiva = data.indicadores.margem_atual_pct >= 0;

  return (
    <div className="space-y-4">
      {/* Faixa de saúde da obra */}
      <div className={cn("flex items-center gap-3 rounded-2xl p-4", saude.bg)}>
        <SaudeIcone className={cn("h-5 w-5 shrink-0", saude.cor)} />
        <div className="flex-1">
          <p className={cn("text-sm font-semibold", saude.cor)}>{saude.label}</p>
          <p className="text-xs text-muted-foreground">
            {data.indicadores.percentual_consumido.toFixed(1)}% do orçamento previsto já foi consumido
          </p>
        </div>
      </div>

      {/* Indicadores principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Valor contratado"
          value={formatMoeda(data.receita.valor_contratado)}
          icon={Wallet}
          cor="blue"
        />
        <StatCard
          label="Custo realizado"
          value={formatMoeda(data.custos.total_realizado)}
          icon={Package}
          cor="purple"
          hint={`Previsto: ${formatMoeda(data.custos.total_previsto)}`}
        />
        <StatCard
          label="Resultado atual"
          value={formatMoeda(data.indicadores.resultado_atual)}
          icon={margemPositiva ? TrendingUp : TrendingDown}
          cor={margemPositiva ? "green" : "red"}
          hint={`Previsto: ${formatMoeda(data.indicadores.resultado_previsto)}`}
        />
        <StatCard
          label="Margem atual"
          value={`${data.indicadores.margem_atual_pct.toFixed(1)}%`}
          icon={margemPositiva ? TrendingUp : TrendingDown}
          cor={margemPositiva ? "green" : "red"}
          hint={`Prevista: ${data.indicadores.margem_prevista_pct.toFixed(1)}%`}
        />
      </div>

      {/* Detalhamento de custos */}
      <Card>
        <CardHeader>
          <CardTitle>Composição do custo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LinhaCusto icone={Package} label="Materiais" cor="text-purple-600" valor={data.custos.material} total={data.custos.total_realizado} />
          <LinhaCusto icone={HardHat} label="Mão de obra" cor="text-amber-600" valor={data.custos.mao_de_obra} total={data.custos.total_realizado} />
          <LinhaCusto icone={Wallet} label="Outras despesas" cor="text-blue-600" valor={data.custos.outros_contas_a_pagar} total={data.custos.total_realizado} />
        </CardContent>
      </Card>
    </div>
  );
}

function LinhaCusto({ icone: Icone, label, cor, valor, total }: {
  icone: React.ElementType; label: string; cor: string; valor: number; total: number;
}) {
  const pct = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <Icone className={cn("h-4 w-4", cor)} />
          {label}
        </span>
        <span className="font-medium tabular-nums">{formatMoeda(valor)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", cor.replace("text-", "bg-"))} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
