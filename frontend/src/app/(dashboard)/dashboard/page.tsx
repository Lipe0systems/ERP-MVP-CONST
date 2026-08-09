"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, Boxes,
  CheckCircle2, HardHat, Landmark, Settings, Users, TrendingUp,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/client";
import { formatMoeda, formatData } from "@/lib/format";
import { cn } from "@/lib/utils";

const TODOS_WIDGETS = [
  "saldo_bancario", "obras_ativas", "obras_concluidas", "clientes",
  "contas_pagar", "contas_receber", "alerta_estoque", "alerta_vencimentos",
  "grafico_fluxo", "grafico_obras", "orcamentos",
] as const;
type WidgetId = (typeof TODOS_WIDGETS)[number];

const WIDGET_LABELS: Record<WidgetId, string> = {
  saldo_bancario: "Saldo bancário", obras_ativas: "Obras ativas",
  obras_concluidas: "Obras concluídas", clientes: "Total de clientes",
  contas_pagar: "A pagar", contas_receber: "A receber",
  alerta_estoque: "Alerta de estoque", alerta_vencimentos: "Alertas de vencimento",
  grafico_fluxo: "Fluxo de caixa", grafico_obras: "Obras por status",
  orcamentos: "Orçamentos por status",
};

const DEFAULT_WIDGETS: WidgetId[] = [...TODOS_WIDGETS];
const LS_KEY = "dashboard_widgets";

function loadWidgets(): WidgetId[] {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) return (JSON.parse(s) as WidgetId[]).filter((w) => TODOS_WIDGETS.includes(w));
  } catch {}
  return DEFAULT_WIDGETS;
}

interface DashboardResumo {
  obras_ativas: number; obras_concluidas: number; clientes: number;
  contas_a_pagar: number; contas_a_receber: number;
  fluxo_de_caixa: { mes: string; entrada: number; saida: number }[];
  saldo_bancario: number;
  obras_por_status: { status: string; label: string; total: number }[];
  contas_vencendo_7_dias: { pagar: any[]; receber: any[] };
  orcamentos: { rascunho: number; aprovado: number; recusado: number; cancelado: number };
  estoque_abaixo_minimo: number;
}

const FALLBACK: DashboardResumo = {
  obras_ativas: 0, obras_concluidas: 0, clientes: 0,
  contas_a_pagar: 0, contas_a_receber: 0,
  fluxo_de_caixa: [{ mes: "—", entrada: 0, saida: 0 }],
  saldo_bancario: 0, obras_por_status: [],
  contas_vencendo_7_dias: { pagar: [], receber: [] },
  orcamentos: { rascunho: 0, aprovado: 0, recusado: 0, cancelado: 0 },
  estoque_abaixo_minimo: 0,
};

const PIE_COLORS: Record<string, string> = {
  planejamento: "#94a3b8", em_andamento: "#f59e0b", pausada: "#fb923c",
  concluida: "#22c55e", cancelada: "#ef4444",
};

async function fetchResumo(): Promise<DashboardResumo> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/resumo`, {
    headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
  });
  if (!res.ok) throw new Error("Falha ao carregar dashboard");
  return res.json();
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-resumo"], queryFn: fetchResumo, retry: 1 });
  const r = data ?? FALLBACK;

  const [widgets, setWidgets] = useState<WidgetId[]>(DEFAULT_WIDGETS);
  const [configurando, setConfigurando] = useState(false);
  useEffect(() => { setWidgets(loadWidgets()); }, []);

  function toggleWidget(id: WidgetId) {
    setWidgets((prev) => {
      const next = prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id];
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }

  const show = (id: WidgetId) => widgets.includes(id);
  const totalAlerts = r.contas_vencendo_7_dias.pagar.length + r.contas_vencendo_7_dias.receber.length;

  return (
    <div className="relative space-y-6">
      {/* Mesh gradient ambiente de fundo */}
      <div className="pointer-events-none fixed inset-0 -z-10 mesh-bg" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá! Aqui está seu <span className="text-gradient-brand">resumo</span>
          </h1>
          <p className="text-sm text-muted-foreground">Visão geral das suas obras e finanças</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfigurando((v) => !v)}>
          <Settings className="mr-2 h-4 w-4" />
          {configurando ? "Feito" : "Personalizar"}
        </Button>
      </div>

      {/* Painel de personalização */}
      {configurando && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium">Widgets exibidos:</p>
            <div className="flex flex-wrap gap-2">
              {TODOS_WIDGETS.map((id) => (
                <button
                  key={id}
                  onClick={() => toggleWidget(id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 ease-ui",
                    widgets.includes(id)
                      ? "border-transparent bg-grad-brand text-white shadow-sm"
                      : "border-muted text-muted-foreground hover:border-muted-foreground"
                  )}
                >
                  {WIDGET_LABELS[id]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saldo — destaque grande com gradiente */}
      {show("saldo_bancario") && (
        <div className="relative overflow-hidden rounded-2xl bg-grad-brand p-6 text-white glow-brand">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl animate-float" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/90">
                <Landmark className="h-4 w-4" />
                <span className="text-sm font-medium">Saldo total em caixa</span>
              </div>
              <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight">
                {isLoading ? "—" : formatMoeda(r.saldo_bancario)}
              </p>
            </div>
            <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>
      )}

      {/* Cards de indicadores — grid vivid */}
      {(show("obras_ativas") || show("obras_concluidas") || show("clientes") || show("contas_pagar") || show("contas_receber")) && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5 stagger-children">
          {show("obras_ativas") && (
            <StatCard label="Obras ativas" value={isLoading ? "—" : r.obras_ativas} icon={HardHat} cor="brand" loading={isLoading} />
          )}
          {show("obras_concluidas") && (
            <StatCard label="Concluídas" value={isLoading ? "—" : r.obras_concluidas} icon={CheckCircle2} cor="green" loading={isLoading} />
          )}
          {show("clientes") && (
            <StatCard label="Clientes" value={isLoading ? "—" : r.clientes} icon={Users} cor="blue" loading={isLoading} />
          )}
          {show("contas_pagar") && (
            <StatCard label="A pagar" value={isLoading ? "—" : formatMoeda(r.contas_a_pagar)} icon={ArrowDownCircle} cor="red" loading={isLoading} />
          )}
          {show("contas_receber") && (
            <StatCard label="A receber" value={isLoading ? "—" : formatMoeda(r.contas_a_receber)} icon={ArrowUpCircle} cor="green" loading={isLoading} />
          )}
        </div>
      )}

      {/* Alertas */}
      {show("alerta_estoque") && !isLoading && r.estoque_abaixo_minimo > 0 && (
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-rose-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Estoque abaixo do mínimo</p>
              <p className="text-xs text-muted-foreground">{r.estoque_abaixo_minimo} item{r.estoque_abaixo_minimo > 1 ? "ns" : ""} precisam de reposição</p>
            </div>
          </div>
          <a href="/estoque" className="shrink-0 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20">Ver estoque →</a>
        </div>
      )}

      {show("alerta_vencimentos") && !isLoading && totalAlerts > 0 && (
        <Card className="overflow-hidden border-amber-500/20 bg-gradient-to-r from-amber-500/[0.07] to-orange-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              {totalAlerts} conta{totalAlerts > 1 ? "s" : ""} vencendo em 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {r.contas_vencendo_7_dias.pagar.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">A PAGAR</p>
                  <div className="space-y-1.5">
                    {r.contas_vencendo_7_dias.pagar.map((c: any) => (
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
                    {r.contas_vencendo_7_dias.receber.map((c: any) => (
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

      {/* Gráficos */}
      {(show("grafico_fluxo") || show("grafico_obras")) && (
        <div className="grid gap-4 lg:grid-cols-3">
          {show("grafico_fluxo") && (
            <Card className={cn("card-vivid overflow-hidden", show("grafico_obras") ? "lg:col-span-2" : "lg:col-span-3")}>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Fluxo de caixa</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={r.fluxo_de_caixa.length ? r.fluxo_de_caixa : [{ mes: "—", entrada: 0, saida: 0 }]}>
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(v: number) => formatMoeda(v)}
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    />
                    <Area type="monotone" dataKey="entrada" name="Entrada" stroke="#22c55e" strokeWidth={2.5} fill="url(#gEntrada)" />
                    <Area type="monotone" dataKey="saida" name="Saída" stroke="#ef4444" strokeWidth={2.5} fill="url(#gSaida)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {show("grafico_obras") && (
            <Card className="card-vivid">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Obras por status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {r.obras_por_status.length === 0 ? (
                  <p className="py-10 text-sm text-muted-foreground">Nenhuma obra.</p>
                ) : (
                  <>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={r.obras_por_status} dataKey="total" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} label={false}>
                            {r.obras_por_status.map((e) => <Cell key={e.status} fill={PIE_COLORS[e.status] ?? "#94a3b8"} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 w-full space-y-1">
                      {r.obras_por_status.map((e) => (
                        <div key={e.status} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[e.status] ?? "#94a3b8" }} />
                            <span className="text-muted-foreground">{e.label}</span>
                          </div>
                          <span className="font-medium tabular-nums">{e.total}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Orçamentos */}
      {show("orcamentos") && (
        <div className="grid gap-4 sm:grid-cols-4 stagger-children">
          {[
            { key: "rascunho" as const, label: "Rascunhos", grad: "from-slate-400 to-slate-500" },
            { key: "aprovado" as const, label: "Aprovados", grad: "from-green-500 to-emerald-600" },
            { key: "recusado" as const, label: "Recusados", grad: "from-red-500 to-rose-600" },
            { key: "cancelado" as const, label: "Cancelados", grad: "from-amber-500 to-orange-600" },
          ].map((item) => (
            <div key={item.key} className="card-vivid rounded-2xl p-4">
              <p className="text-xs font-medium text-muted-foreground">Orç. {item.label}</p>
              <p className={cn("mt-1 bg-gradient-to-br bg-clip-text text-3xl font-bold tabular-nums text-transparent", item.grad)}>
                {isLoading ? "—" : r.orcamentos[item.key]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
