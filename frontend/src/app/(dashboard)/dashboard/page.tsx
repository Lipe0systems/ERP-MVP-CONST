"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, Boxes,
  CheckCircle2, HardHat, Landmark, Settings, TrendingUp, Users,
} from "lucide-react";
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatMoeda, formatData } from "@/lib/format";

// Todos os widgets disponíveis
const TODOS_WIDGETS = [
  "saldo_bancario", "obras_ativas", "obras_concluidas", "clientes",
  "contas_pagar", "contas_receber", "alerta_estoque", "alerta_vencimentos",
  "grafico_fluxo", "grafico_obras", "orcamentos", "proximos_vencimentos",
] as const;

type WidgetId = (typeof TODOS_WIDGETS)[number];

const WIDGET_LABELS: Record<WidgetId, string> = {
  saldo_bancario: "Saldo bancário",
  obras_ativas: "Obras ativas",
  obras_concluidas: "Obras concluídas",
  clientes: "Total de clientes",
  contas_pagar: "A pagar",
  contas_receber: "A receber",
  alerta_estoque: "Alerta de estoque",
  alerta_vencimentos: "Alertas de vencimento",
  grafico_fluxo: "Fluxo de caixa",
  grafico_obras: "Obras por status",
  orcamentos: "Orçamentos por status",
  proximos_vencimentos: "Próximos vencimentos",
};

const DEFAULT_WIDGETS: WidgetId[] = [
  "saldo_bancario", "obras_ativas", "clientes", "contas_pagar", "contas_receber",
  "alerta_estoque", "alerta_vencimentos", "grafico_fluxo", "grafico_obras", "orcamentos",
];

const LS_KEY = "dashboard_widgets";

function loadWidgets(): WidgetId[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as WidgetId[];
      return parsed.filter((w) => TODOS_WIDGETS.includes(w));
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
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
            <p className="mb-3 text-sm font-medium">Selecione os widgets que deseja exibir:</p>
            <div className="flex flex-wrap gap-2">
              {TODOS_WIDGETS.map((id) => (
                <button
                  key={id}
                  onClick={() => toggleWidget(id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    widgets.includes(id)
                      ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "border-muted text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {WIDGET_LABELS[id]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saldo bancário */}
      {show("saldo_bancario") && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">Saldo total em caixa</span>
            </div>
            {isLoading ? <Skeleton className="h-7 w-32" />
              : <span className={`text-xl font-bold ${r.saldo_bancario >= 0 ? "text-green-600" : "text-destructive"}`}>{formatMoeda(r.saldo_bancario)}</span>}
          </CardContent>
        </Card>
      )}

      {/* Cards de indicadores */}
      {(show("obras_ativas") || show("obras_concluidas") || show("clientes") || show("contas_pagar") || show("contas_receber")) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {show("obras_ativas") && (
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Obras ativas</CardTitle><HardHat className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-semibold">{isLoading ? "…" : r.obras_ativas}</div></CardContent></Card>
          )}
          {show("obras_concluidas") && (
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Concluídas</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-semibold">{isLoading ? "…" : r.obras_concluidas}</div></CardContent></Card>
          )}
          {show("clientes") && (
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clientes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-semibold">{isLoading ? "…" : r.clientes}</div></CardContent></Card>
          )}
          {show("contas_pagar") && (
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">A pagar</CardTitle><ArrowDownCircle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-semibold text-destructive">{isLoading ? "…" : formatMoeda(r.contas_a_pagar)}</div></CardContent></Card>
          )}
          {show("contas_receber") && (
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">A receber</CardTitle><ArrowUpCircle className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-semibold text-green-600">{isLoading ? "…" : formatMoeda(r.contas_a_receber)}</div></CardContent></Card>
          )}
        </div>
      )}

      {/* Alerta estoque mínimo */}
      {show("alerta_estoque") && !isLoading && r.estoque_abaixo_minimo > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Boxes className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Estoque abaixo do mínimo</p>
                <p className="text-xs text-muted-foreground">{r.estoque_abaixo_minimo} item{r.estoque_abaixo_minimo > 1 ? "ns" : ""} abaixo do nível mínimo</p>
              </div>
            </div>
            <a href="/estoque" className="text-xs font-medium text-red-600 hover:underline">Ver estoque →</a>
          </CardContent>
        </Card>
      )}

      {/* Alertas de vencimento */}
      {show("alerta_vencimentos") && !isLoading && totalAlerts > 0 && (
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
            <Card className={show("grafico_obras") ? "lg:col-span-2" : "lg:col-span-3"}>
              <CardHeader><CardTitle>Fluxo de caixa</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={r.fluxo_de_caixa.length ? r.fluxo_de_caixa : [{ mes: "—", entrada: 0, saida: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" fontSize={12} /><YAxis fontSize={12} />
                    <Tooltip formatter={(v: number) => formatMoeda(v)} />
                    <Line type="monotone" dataKey="entrada" name="Entrada" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="saida" name="Saída" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {show("grafico_obras") && (
            <Card>
              <CardHeader><CardTitle>Obras por status</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center">
                {r.obras_por_status.length === 0 ? (
                  <p className="py-10 text-sm text-muted-foreground">Nenhuma obra.</p>
                ) : (
                  <>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={r.obras_por_status} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={false}>
                            {r.obras_por_status.map((entry) => <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? "#94a3b8"} />)}
                          </Pie>
                          <Tooltip />
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
          )}
        </div>
      )}

      {/* Orçamentos por status */}
      {show("orcamentos") && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { key: "rascunho" as const, label: "Rascunhos", color: "text-muted-foreground" },
            { key: "aprovado" as const, label: "Aprovados", color: "text-green-600" },
            { key: "recusado" as const, label: "Recusados", color: "text-destructive" },
            { key: "cancelado" as const, label: "Cancelados", color: "text-amber-600" },
          ].map((item) => (
            <Card key={item.key}>
              <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Orçamentos {item.label}</CardTitle></CardHeader>
              <CardContent><p className={`text-2xl font-semibold ${item.color}`}>{isLoading ? "…" : r.orcamentos[item.key]}</p></CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
