"use client";

/**
 * Extraído de dashboard/page.tsx para permitir lazy loading (next/dynamic)
 * do Recharts — biblioteca pesada que não precisa entrar no bundle inicial
 * do Dashboard antes da tela ficar interativa.
 *
 * Recorte deliberado: só o que REALMENTE depende do Recharts está aqui.
 * A estrutura do Card, o cabeçalho com os botões de período, o estado de
 * loading (Skeleton) e o empty-state continuam no arquivo pai — nada
 * disso precisa da biblioteca, então não faz sentido atrasar a exibição
 * deles esperando o Recharts carregar.
 */
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface FluxoCaixaChartProps {
  data: { mes: string; entrada: number; saida: number }[];
  formatMoeda: (v: number) => string;
}

export function FluxoCaixaChart({ data, formatMoeda }: FluxoCaixaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gEntrada" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gSaida" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip
          formatter={(v: number) => formatMoeda(v)}
          contentStyle={{
            borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))",
            boxShadow: "0 4px 20px hsl(var(--shadow-color) / 0.12)",
          }}
        />
        <Area type="monotone" dataKey="entrada" name="Entrada" stroke="#22c55e" strokeWidth={2.5} fill="url(#gEntrada)" />
        <Area type="monotone" dataKey="saida" name="Saída" stroke="#ef4444" strokeWidth={2.5} fill="url(#gSaida)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
