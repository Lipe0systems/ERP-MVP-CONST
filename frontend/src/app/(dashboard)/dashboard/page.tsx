"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";

// Lazy loading: o Recharts só entra no bundle quando um destes componentes
// realmente for renderizado — não no carregamento inicial da página.
// ssr:false porque Recharts usa medidas do DOM (ResponsiveContainer),
// então não tem por que tentar renderizar no servidor de qualquer forma.
const FluxoCaixaChart = dynamic(
  () => import("@/components/dashboard/fluxo-caixa-chart").then((m) => m.FluxoCaixaChart),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-lg" /> }
);
const ObrasPorStatusChart = dynamic(
  () => import("@/components/dashboard/obras-por-status-chart").then((m) => m.ObrasPorStatusChart),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-lg" /> }
);
import { PIE_COLORS } from "@/components/dashboard/obras-por-status-chart";
import { useState, useEffect } from "react";
import {
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, Ban, Boxes, CalendarDays,
  CheckCircle2, FileText, HardHat, Landmark, Settings, Users, TrendingUp, XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { SaudeObrasWidget } from "@/components/dashboard/saude-obras-widget";
import { LucroWidget } from "@/components/dashboard/lucro-widget";
import { AnaliseCategoriaWidget } from "@/components/dashboard/analise-categoria-widget";
import { ProjecaoSaldoWidget } from "@/components/dashboard/projecao-saldo-widget";
import { apiFetch } from "@/lib/api/client";
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
  saldo_bancario: "Saldo bancário", obras_ativas: "Instalações ativas",
  obras_concluidas: "Obras concluídas", clientes: "Total de clientes",
  contas_pagar: "A pagar", contas_receber: "A receber",
  alerta_estoque: "Alerta de estoque", alerta_vencimentos: "Alertas de vencimento",
  grafico_fluxo: "Fluxo de caixa", grafico_obras: "Instalações por status",
  orcamentos: "Orçamentos por status", saude_obras: "Saúde das instalações",
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

// PIE_COLORS agora vem de @/components/dashboard/obras-por-status-chart —
// fonte única, usada tanto no gráfico quanto na legenda abaixo dele.

type PeriodoFluxo = "7d" | "15d" | "30d" | "60d" | "90d" | "6m" | "12m";
const OPCOES_PERIODO: { valor: PeriodoFluxo; label: string }[] = [
  { valor: "7d", label: "7D" }, { valor: "15d", label: "15D" }, { valor: "30d", label: "30D" },
  { valor: "60d", label: "60D" }, { valor: "90d", label: "90D" },
  { valor: "6m", label: "6M" }, { valor: "12m", label: "12M" },
];

// Usa o cliente central (apiFetch): herda sessão compartilhada, timeout,
// e o tratamento de erro padronizado — antes esta função duplicava tudo
// isso com fetch próprio, inclusive um getSession() a cada chamada.
const fetchResumo = (periodoFluxo: string) =>
  apiFetch<DashboardResumo>(`/dashboard/resumo?periodo_fluxo=${periodoFluxo}`);

export default function DashboardPage() {
  const [periodoFluxo, setPeriodoFluxo] = useState<PeriodoFluxo>("6m");
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-resumo", periodoFluxo],
    queryFn: () => fetchResumo(periodoFluxo),
    retry: 1,
  });
  const r = data ?? FALLBACK;

  // Resumo do fluxo de caixa no período selecionado — soma tudo pra exibir
  // no cabeçalho do card, e decide se mostra o empty state elegante
  // (nenhum dado real, não é loading).
  const totalFluxoPeriodo = r.fluxo_de_caixa.reduce(
    (acc, item) => ({
      entrada: acc.entrada + item.entrada,
      saida: acc.saida + item.saida,
      temDados: acc.temDados || item.entrada > 0 || item.saida > 0,
    }),
    { entrada: 0, saida: 0, temDados: false }
  );

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
              label="Instalações ativas" icon={HardHat} tint="blue" loading={isLoading}
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
          <Link href="/estoque" className="shrink-0 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20">Ver estoque →</Link>
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <span className="icon-vivid kpi-green h-9 w-9 shrink-0">
                    <TrendingUp className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                  <CardTitle className="text-base font-semibold text-foreground">Fluxo de caixa</CardTitle>
                  {/* Resumo de tendência do período — entradas x saídas somadas,
                      dá contexto antes mesmo de olhar o gráfico. */}
                  {!isLoading && totalFluxoPeriodo.temDados && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        +{formatMoeda(totalFluxoPeriodo.entrada)}
                      </span>
                      {" · "}
                      <span className="font-medium text-red-500">
                        -{formatMoeda(totalFluxoPeriodo.saida)}
                      </span>
                      {" no período"}
                    </p>
                  )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5">
                  {OPCOES_PERIODO.map((op) => (
                    <button
                      key={op.valor}
                      onClick={() => setPeriodoFluxo(op.valor)}
                      className={cn(
                        "rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-colors",
                        periodoFluxo === op.valor
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="h-64">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : !totalFluxoPeriodo.temDados ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">Nenhuma movimentação neste período</p>
                    <p className="text-xs text-muted-foreground">
                      Contas liquidadas aparecem aqui automaticamente.
                    </p>
                  </div>
                ) : (
                <FluxoCaixaChart data={r.fluxo_de_caixa} formatMoeda={formatMoeda} />
                )}
              </CardContent>
            </Card>
          )}
          {show("grafico_obras") && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <span className="icon-vivid kpi-blue h-9 w-9 shrink-0">
                  <HardHat className="h-[18px] w-[18px]" />
                </span>
                <CardTitle className="text-base font-semibold text-foreground">Instalações por status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {r.obras_por_status.length === 0 ? (
                  <p className="py-10 text-sm text-muted-foreground">Nenhuma instalação.</p>
                ) : (
                  <>
                    <div className="h-44 w-full">
                      <ObrasPorStatusChart data={r.obras_por_status} />
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
            { key: "rascunho" as const, label: "Rascunhos", cor: "kpi-blue", Icon: FileText },
            { key: "aprovado" as const, label: "Aprovados", cor: "kpi-green", Icon: CheckCircle2 },
            { key: "recusado" as const, label: "Recusados", cor: "kpi-red", Icon: XCircle },
            { key: "cancelado" as const, label: "Cancelados", cor: "kpi-amber", Icon: Ban },
          ].map((item) => (
            // Antes: card-vivid puro, sem ícone nem cor — a caixa existia,
            // mas ficava "apagada" perto dos KPIs do topo, que já eram
            // Vivid. Mesmo padrão de ícone tingido (icon-vivid) usado em
            // todo o resto do sistema, não uma cor nova inventada aqui.
            <div key={item.key} className={cn("kpi-vivid rounded-2xl p-4", item.cor)}>
              <div className="flex items-center gap-3">
                <span className="icon-vivid h-9 w-9 shrink-0">
                  <item.Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Orç. {item.label}</p>
                  <p className="text-2xl font-bold tabular-nums tracking-tight">
                    {isLoading ? "—" : r.orcamentos[item.key]}
                  </p>
                </div>
              </div>
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
