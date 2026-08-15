"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, Boxes, CalendarDays,
  CheckCircle2, HardHat, Landmark, Settings, Users,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { SaudeObrasWidget } from "@/components/dashboard/saude-obras-widget";
import { LucroWidget } from "@/components/dashboard/lucro-widget";
import { AnaliseCategoriaWidget } from "@/components/dashboard/analise-categoria-widget";
import { ProjecaoSaldoWidget } from "@/components/dashboard/projecao-saldo-widget";
import { createClient } from "@/lib/supabase/client";
import { formatMoeda, formatData } from "@/lib/format";
import { cn } from "@/lib/utils";

const TODOS_WIDGETS = [
  "saldo_bancario", "obras_ativas", "obras_concluidas", "clientes",
  "contas_pagar", "contas_receber", "alerta_estoque", "alerta_vencimentos",
  "grafico_fluxo", "grafico_obras", "orcamentos", "saude_obras",
  "lucro", "analise_categoria", "projecao_saldo",
] as const;
type WidgetId = (typeof TODOS_WIDGETS)[number];

const WIDGET_LABELS: Record<WidgetId, string> = {
  saldo_bancario: "Saldo bancário", obras_ativas: "Obras ativas",
  obras_concluidas: "Obras concluídas", clientes: "Total de clientes",
  contas_pagar: "A pagar", contas_receber: "A receber",
  alerta_estoque: "Alerta de estoque", alerta_vencimentos: "Alertas de vencimento",
  grafico_fluxo: "Fluxo de caixa", grafico_obras: "Obras por status",
  orcamentos: "Orçamentos por status", saude_obras: "Saúde das obras",
  lucro: "Lucro realizado", analise_categoria: "Despesas por categoria",
  projecao_saldo: "Projeção de saldo",
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
      {/* Header — sem mesh de fundo e sem texto em gradiente: a referência
          usa fundo liso e deixa o destaque para os números. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-page-title">Olá!</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aqui está o resumo da sua operação</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] text-muted-foreground sm:inline-flex">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="sm" onClick={() => setConfigurando((v) => !v)}>
            <Settings className="mr-2 h-4 w-4" />
            {configurando ? "Feito" : "Personalizar"}
          </Button>
        </div>
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
                    "rounded-full border px-3 py-1 text-xs font-medium transition-[background-color,color,border-color] duration-150 ease-ui",
                    widgets.includes(id)
                      ? "border-transparent bg-primary text-primary-foreground"
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

      {/* KPIs — o antigo banner laranja gigante do saldo virou o primeiro
          KPI da faixa. Motivo (briefing): "laranja é acento, não usar
          grandes áreas laranjas". O saldo continua sendo o dado mais
          importante, mas agora pelo tamanho do número, não pelo tamanho
          do bloco colorido. */}
      {(show("saldo_bancario") || show("contas_receber") || show("contas_pagar") ||
        show("obras_ativas") || show("clientes") || show("obras_concluidas")) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger-children">
          {show("saldo_bancario") && (
            <KpiCard
              label="Saldo em caixa" icon={Landmark} tint="amber" loading={isLoading}
              valor={isLoading ? "—" : formatMoeda(r.saldo_bancario)}
            />
          )}
          {show("contas_receber") && (
            <KpiCard
              label="A receber" icon={ArrowUpCircle} tint="green" loading={isLoading}
              valor={isLoading ? "—" : formatMoeda(r.contas_a_receber)}
            />
          )}
          {show("contas_pagar") && (
            <KpiCard
              label="A pagar" icon={ArrowDownCircle} tint="red" loading={isLoading}
              valor={isLoading ? "—" : formatMoeda(r.contas_a_pagar)}
            />
          )}
          {show("obras_ativas") && (
            <KpiCard
              label="Obras ativas" icon={HardHat} tint="blue" loading={isLoading}
              valor={isLoading ? "—" : String(r.obras_ativas)}
            />
          )}
          {show("clientes") && (
            <KpiCard
              label="Clientes" icon={Users} tint="purple" loading={isLoading}
              valor={isLoading ? "—" : String(r.clientes)}
            />
          )}
          {show("obras_concluidas") && (
            <KpiCard
              label="Obras concluídas" icon={CheckCircle2} tint="green" loading={isLoading}
              valor={isLoading ? "—" : String(r.obras_concluidas)}
            />
          )}
        </div>
      )}

      {/* Alertas */}
      {show("alerta_estoque") && !isLoading && r.estoque_abaixo_minimo > 0 && (
        <div className="panel flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="tint-red flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Estoque abaixo do mínimo</p>
              <p className="text-xs text-muted-foreground">{r.estoque_abaixo_minimo} item{r.estoque_abaixo_minimo > 1 ? "ns" : ""} precisam de reposição</p>
            </div>
          </div>
          <a href="/estoque" className="shrink-0 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20">Ver estoque →</a>
        </div>
      )}

      {show("alerta_vencimentos") && !isLoading && totalAlerts > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
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
              <p className={cn("mt-1 text-3xl font-bold tabular-nums tracking-tight")}>
                {isLoading ? "—" : r.orcamentos[item.key]}
              </p>
            </div>
          ))}
        </div>
      )}

      {show("saude_obras") && <SaudeObrasWidget />}

      {(show("lucro") || show("analise_categoria")) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {show("lucro") && <LucroWidget />}
          {show("analise_categoria") && <AnaliseCategoriaWidget />}
        </div>
      )}

      {show("projecao_saldo") && <ProjecaoSaldoWidget />}
    </div>
  );
}
