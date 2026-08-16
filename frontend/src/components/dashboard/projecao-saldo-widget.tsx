"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodoSelect } from "@/components/ui/periodo-select";
import { useProjecaoSaldo } from "@/hooks/use-financeiro-v2";
import { formatMoeda, formatData } from "@/lib/format";

export function ProjecaoSaldoWidget() {
  const [dias, setDias] = useState(30);
  const { data, isLoading } = useProjecaoSaldo(dias);

  const pontos = (data?.pontos ?? []).map((p) => ({ ...p, dataLabel: formatData(p.data) }));

  return (
    <Card className="card-vivid">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="tint-blue flex h-7 w-7 items-center justify-center rounded-lg"><Activity className="h-4 w-4" /></span>
          Projeção de saldo
        </CardTitle>
        <PeriodoSelect value={dias} onChange={setDias} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <div className="mb-3 flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Saldo atual</p>
                <p className="text-lg font-bold tabular-nums">{formatMoeda(data?.saldo_atual ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projetado em {dias} dias</p>
                <p className="text-lg font-bold tabular-nums text-gradient-blue">
                  {formatMoeda(data?.saldo_final_projetado ?? 0)}
                </p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pontos}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="dataLabel" tick={{ fontSize: 10 }} interval={Math.floor(pontos.length / 6)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatMoeda(v)} width={70} />
                  <Tooltip formatter={(v: number) => formatMoeda(v)} labelFormatter={(l) => `Data: ${l}`} />
                  <Line type="monotone" dataKey="saldo_projetado" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
