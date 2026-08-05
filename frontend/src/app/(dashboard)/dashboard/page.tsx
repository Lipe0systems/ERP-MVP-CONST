"use client";

import { useQuery } from "@tanstack/react-query";
import { HardHat, CheckCircle2, Users, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { DashboardResumo } from "@/types";

async function fetchResumo(): Promise<DashboardResumo> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/resumo`, {
    headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
  });

  if (!res.ok) throw new Error("Falha ao carregar resumo do dashboard");
  return res.json();
}

const fallbackFluxo = [
  { mes: "Jan", entrada: 0, saida: 0 },
  { mes: "Fev", entrada: 0, saida: 0 },
  { mes: "Mar", entrada: 0, saida: 0 },
  { mes: "Abr", entrada: 0, saida: 0 },
];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-resumo"],
    queryFn: fetchResumo,
    retry: 1,
  });

  const resumo = data ?? {
    obras_ativas: 0,
    obras_concluidas: 0,
    clientes: 0,
    contas_a_pagar: 0,
    contas_a_receber: 0,
    fluxo_de_caixa: fallbackFluxo,
  };

  const cards = [
    { label: "Obras ativas", value: resumo.obras_ativas, icon: HardHat },
    { label: "Obras concluídas", value: resumo.obras_concluidas, icon: CheckCircle2 },
    { label: "Clientes", value: resumo.clientes, icon: Users },
    {
      label: "Contas a pagar",
      value: resumo.contas_a_pagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: ArrowDownCircle,
    },
    {
      label: "Contas a receber",
      value: resumo.contas_a_receber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: ArrowUpCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral das suas obras e finanças</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {isLoading ? "…" : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de caixa</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={resumo.fluxo_de_caixa.length ? resumo.fluxo_de_caixa : fallbackFluxo}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="entrada" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="saida" stroke="hsl(var(--destructive))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
