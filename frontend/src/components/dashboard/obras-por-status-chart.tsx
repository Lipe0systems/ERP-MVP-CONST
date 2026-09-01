"use client";

/**
 * Mesma extração de fluxo-caixa-chart.tsx: só a parte que depende do
 * Recharts. A legenda abaixo do gráfico (que também usa PIE_COLORS)
 * permanece no arquivo pai — por isso PIE_COLORS é exportado daqui, para
 * ter uma única fonte da verdade em vez de duplicar o mapa de cores.
 */
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export const PIE_COLORS: Record<string, string> = {
  planejamento: "#94a3b8", em_andamento: "#f59e0b", pausada: "#fb923c",
  concluida: "#22c55e", cancelada: "#ef4444",
};

interface ObrasPorStatusChartProps {
  data: { status: string; label: string; total: number }[];
}

export function ObrasPorStatusChart({ data }: ObrasPorStatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} label={false}>
          {data.map((e) => <Cell key={e.status} fill={PIE_COLORS[e.status] ?? "#94a3b8"} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
