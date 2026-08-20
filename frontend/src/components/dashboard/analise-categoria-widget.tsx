"use client";

import { useState } from "react";
import { PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodoSelect } from "@/components/ui/periodo-select";
import { useAnaliseCategoria } from "@/hooks/use-financeiro-v2";
import { formatMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

const CORES = ["bg-purple-500", "bg-blue-500", "bg-amber-500", "bg-green-500", "bg-pink-500", "bg-cyan-500"];

export function AnaliseCategoriaWidget() {
  const [dias, setDias] = useState(30);
  const { data, isLoading } = useAnaliseCategoria(dias);

  const despesas = data?.despesas ?? [];
  const totalDespesas = despesas.reduce((s, d) => s + d.total, 0);

  return (
    <Card className="card-vivid">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="icon-vivid kpi-purple h-7 w-7 shrink-0"><PieChart className="h-4 w-4" /></span>
          Despesas por categoria
        </CardTitle>
        <PeriodoSelect value={dias} onChange={setDias} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : despesas.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma despesa paga neste período.</p>
        ) : (
          <div className="space-y-3">
            {despesas.slice(0, 6).map((d, i) => {
              const pct = totalDespesas > 0 ? (d.total / totalDespesas) * 100 : 0;
              return (
                <div key={d.categoria} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", CORES[i % CORES.length])} />
                      {d.categoria}
                    </span>
                    <span className="font-medium tabular-nums">{formatMoeda(d.total)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", CORES[i % CORES.length])} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
