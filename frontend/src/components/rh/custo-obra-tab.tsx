"use client";

import { DollarSign, HardHat, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useCustoMaoObra } from "@/hooks/use-rh";
import { formatMoeda } from "@/lib/format";

export function CustoObraTab() {
  const { data, isLoading } = useCustoMaoObra();
  const custos = data ?? [];
  const total = custos.reduce((s, c) => s + c.custo_mensal_estimado, 0);

  if (isLoading) {
    return <Card><CardContent className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</CardContent></Card>;
  }

  if (custos.length === 0) {
    return <Card><CardContent><EmptyState icon={DollarSign} title="Sem custos de mão de obra" description="Aloque funcionários às instalações para ver o custo estimado aqui." /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Total geral */}
      <div className="relative overflow-hidden rounded-2xl bg-grad-purple p-5 text-white glow-purple">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Custo mensal estimado (todas as obras)</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{formatMoeda(total)}</p>
          </div>
          <DollarSign className="h-10 w-10 text-white/40" />
        </div>
      </div>

      {/* Por obra */}
      <div className="grid gap-3 sm:grid-cols-2">
        {custos.map((c) => (
          <Card key={c.obra_id} className="card-vivid">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-grad-brand text-white shadow-md">
                    <HardHat className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{c.obra_nome}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {c.funcionarios} funcionário{c.funcionarios > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-gradient-purple">{formatMoeda(c.custo_mensal_estimado)}</p>
              <p className="text-[11px] text-muted-foreground">estimativa mensal</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Estimativa baseada nos salários dos funcionários com alocação ativa. Não considera faltas ou horas extras.
      </p>
    </div>
  );
}
