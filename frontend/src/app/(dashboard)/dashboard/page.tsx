"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  HardHat,
  Landmark,
  Lock,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatMoeda, formatData } from "@/lib/format";

interface ContaAlerta {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
}

interface DashboardResumo {
  obras_ativas: number;
  obras_concluidas: number;
  clientes: number;
  contas_a_pagar: number;
  contas_a_receber: number;
  fluxo_de_caixa: { mes: string; entrada: number; saida: number }[];
  saldo_bancario: number;
  obras_por_status: { status: string; label: string; total: number }[];
  contas_vencendo_7_dias: { pagar: ContaAlerta[]; receber: ContaAlerta[] };
  orcamentos: { rascunho: number; aprovado: number; recusado: number; cancelado: number };
}

async function fetchResumo(): Promise<DashboardResumo> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/resumo`, {
    headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
  });
  if (!res.ok) throw new Error("Falha ao carregar resumo do dashboard");
  return res.json();
}

const FALLBACK: DashboardResumo = {
  obras_ativas: 0, obras_concluidas: 0, clientes: 0,
  contas_a_pagar: 0, contas_a_receber: 0,
  fluxo_de_caixa: [{ mes: "—", entrada: 0, saida: 0 }],
  saldo_bancario: 0,
  obras_por_status: [],
  contas_vencendo_7_dias: { pagar: [], receber: [] },
  orcamentos: { rascunho: 0, aprovado: 0, recusado: 0, cancelado: 0 },
};

const PIE_COLORS: Record<string, string> = {
  planejamento: "#94a3b8",
  em_andamento: "#f59e0b",
  pausada: "#fb923c",
  concluida: "#22c55e",
  cancelada: "#ef4444",
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-resumo"], queryFn: fetchResumo, retry: 1 });
  const r = data ?? FALLBACK;
  const totalAlerts = r.contas_vencendo_7_dias.pagar.length + r.contas_vencendo_7_dias.receber.length;

  const cards = [
    { label: "Obras ativas", value: r.obras_ativas, icon: HardHat },
    { label: "Obras concluídas", value: r.obras_concluidas, icon: CheckCircle2 },
    { label: "Clientes", value: r.clientes, icon: Users },
    { label: "A pagar", value: formatMoeda(r.contas_a_pagar), icon: ArrowDownCircle, red: true },
    { label: "A receber", value: formatMoeda(r.contas_a_receber), icon: ArrowUpCircle, green: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral das suas obras e finanças</p>
      </div>

      {/* Saldo bancário em destaque */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Landmark className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium">Saldo total em caixa</span>
          </div>
          {isLoading
            ? <Skeleton className="h-7 w-32" />
            : <span className={`text-xl font-bold ${r.saldo_bancario >= 0 ? "text-green-600" : "text-destructive"}`}>{formatMoeda(r.saldo_bancario)}</span>
          }
        </CardContent>
      </Card>

      {/* Cards de indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.red ? "text-destructive" : card.green ? "text-green-600" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold ${card.red ? "text-destructive" : card.green ? "text-green-600" : ""}`}>
                {isLoading ? "…" : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerta de contas vencendo */}
      {!isLoading && totalAlerts > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              {totalAlerts} conta{totalAlerts > 1 ? "s" : ""} vencendo nos próximos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {r.contas_vencendo_7_dias.pagar.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">A PAGAR</p>
                  <div className="space-y-1.5">
                    {r.contas_vencendo_7_dias.pagar.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground">{c.descricao}</span>
                        <div className="ml-2 shrink-0 text-right">
                          <span className="font-medium text-destructive">{formatMoeda(c.valor)}</span>
                          <span className="ml-1 text-xs text-muted-foreground">{formatData(c.vencimento)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {r.contas_vencendo_7_dias.receber.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">A RECEBER</p>
                  <div className="space-y-1.5">
                    {r.contas_vencendo_7_dias.receber.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground">{c.descricao}</span>
                        <div className="ml-2 shrink-0 text-right">
                          <span className="font-medium text-green-600">{formatMoeda(c.valor)}</span>
                          <span className="ml-1 text-xs text-muted-foreground">{formatData(c.vencimento)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos: fluxo de caixa + obras por status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Fluxo de caixa</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={r.fluxo_de_caixa.length ? r.fluxo_de_caixa : [{ mes: "—", entrada: 0, saida: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatMoeda(v)} />
                <Line type="monotone" dataKey="entrada" name="Entrada" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="saida" name="Saída" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Obras por status</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center">
            {r.obras_por_status.length === 0 ? (
              <p className="py-10 text-sm text-muted-foreground">Nenhuma obra cadastrada.</p>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={r.obras_por_status} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={false}>
                        {r.obras_por_status.map((entry) => (
                          <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number, name: string) => [v, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 w-full space-y-1">
                  {r.obras_por_status.map((entry) => (
                    <div key={entry.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[entry.status] ?? "#94a3b8" }} />
                        <span className="text-muted-foreground">{entry.label}</span>
                      </div>
                      <span className="font-medium">{entry.total}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orçamentos por status */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { key: "rascunho" as const, label: "Rascunhos", color: "text-muted-foreground" },
          { key: "aprovado" as const, label: "Aprovados", color: "text-green-600" },
          { key: "recusado" as const, label: "Recusados", color: "text-destructive" },
          { key: "cancelado" as const, label: "Cancelados", color: "text-amber-600" },
        ].map((item) => (
          <Card key={item.key}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Orçamentos {item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-semibold ${item.color}`}>
                {isLoading ? "…" : r.orcamentos[item.key]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Módulos em breve */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Módulos em desenvolvimento</h2>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">Em breve</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Atendimentos", icon: ClipboardList, desc: "Registre e acompanhe atendimentos de obra" },
            { label: "Vendas", icon: ShoppingBag, desc: "Converta orçamentos em vendas com um clique" },
            { label: "Documentos", icon: FolderOpen, desc: "Centralize contratos, ARTs e documentos" },
            { label: "Configurações", icon: Settings, desc: "Personalize o sistema para sua empresa" },
          ].map((m) => (
            <div key={m.label} className="relative flex flex-col gap-2 overflow-hidden rounded-xl border border-dashed bg-muted/30 p-4 opacity-70">
              <div className="flex items-center gap-2">
                <m.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{m.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm">
                <Lock className="h-2.5 w-2.5" />Em breve
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
