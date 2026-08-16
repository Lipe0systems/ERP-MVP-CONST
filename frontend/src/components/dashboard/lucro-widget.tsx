"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodoSelect } from "@/components/ui/periodo-select";
import { useLucro } from "@/hooks/use-financeiro-v2";
import { formatMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LucroWidget() {
  const [dias, setDias] = useState(30);
  const { data, isLoading } = useLucro(dias);

  const positivo = (data?.lucro ?? 0) >= 0;

  return (
    <Card className="card-vivid">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="tint-green flex h-7 w-7 items-center justify-center rounded-lg"><DollarSign className="h-4 w-4" /></span>
          Lucro realizado
        </CardTitle>
        <PeriodoSelect value={dias} onChange={setDias} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className={cn("text-3xl font-bold tabular-nums", positivo ? "text-gradient-green" : "text-red-600")}>
                  {formatMoeda(data?.lucro ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Receita {formatMoeda(data?.receita_realizada ?? 0)} − Despesa {formatMoeda(data?.despesa_realizada ?? 0)}
                </p>
              </div>
              {data?.variacao_pct !== null && data?.variacao_pct !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                  data.variacao_pct >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                )}>
                  {data.variacao_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(data.variacao_pct).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Comparado aos {dias} dias anteriores · só considera dinheiro que entrou/saiu de fato
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
