"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, HardHat, LayoutDashboard, ClipboardList, ShoppingCart,
  Boxes, Users, NotebookPen, Wallet, FileArchive, TrendingUp, ExternalLink,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ObraStatusBadge } from "@/components/obras/obra-status-badge";
import { ResultadoObraCard } from "@/components/obras/resultado-obra-card";
import { useWorkspaceObra } from "@/hooks/use-workspace-obra";
import { formatMoeda, formatData } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ObraStatus } from "@/types";

type Aba = "visao" | "planejamento" | "compras" | "materiais" | "equipe" | "diario" | "financeiro" | "documentos" | "resultado";

const ABAS: { id: Aba; label: string; icon: React.ElementType }[] = [
  { id: "visao", label: "Visão geral", icon: LayoutDashboard },
  { id: "planejamento", label: "Planejamento", icon: ClipboardList },
  { id: "compras", label: "Compras", icon: ShoppingCart },
  { id: "materiais", label: "Materiais", icon: Boxes },
  { id: "equipe", label: "Equipe", icon: Users },
  { id: "diario", label: "Diário", icon: NotebookPen },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "documentos", label: "Documentos", icon: FileArchive },
  { id: "resultado", label: "Resultado", icon: TrendingUp },
];

const TIPO_MOV_LABEL: Record<string, string> = {
  entrada: "Entrada", transferencia: "Transferência", consumo: "Consumo", ajuste: "Ajuste",
};

export default function WorkspaceObraPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useWorkspaceObra(params.id);
  const [aba, setAba] = useState<Aba>("visao");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Instalação não encontrada.</p>
        <Button variant="outline" onClick={() => router.push("/obras")}>Voltar</Button>
      </div>
    );
  }

  const { obra } = data;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/obras")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-grad-brand text-white shadow-lg ring-4 ring-amber-500/20">
          <HardHat className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{obra.nome}</h1>
          <ObraStatusBadge status={obra.status as ObraStatus} />
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1">
        {ABAS.map((a) => {
          const ativo = aba === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,border-color,color] duration-150",
                ativo ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <a.icon className={cn("h-4 w-4", ativo && "text-amber-600")} />
              <span className="whitespace-nowrap">{a.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {aba === "visao" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
              <Info label="Responsável" value={obra.responsavel} />
              <Info label="Endereço" value={obra.endereco} />
              <Info label="Início" value={obra.data_inicio ? formatData(obra.data_inicio) : null} />
              <Info label="Prazo" value={obra.data_previsao ? formatData(obra.data_previsao) : null} />
            </CardContent>
          </Card>
          <ResultadoObraCard obraId={obra.id} />
        </div>
      )}

      {aba === "planejamento" && (
        <Card>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
            <Info label="Responsável" value={obra.responsavel} />
            <Info label="Valor previsto" value={formatMoeda(obra.valor_previsto)} />
            <Info label="Início previsto" value={obra.data_inicio ? formatData(obra.data_inicio) : null} />
            <Info label="Prazo previsto" value={obra.data_previsao ? formatData(obra.data_previsao) : null} />
            <div className="sm:col-span-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/obras")}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Editar dados da obra
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {aba === "compras" && (
        <SecaoLista
          vazio={data.compras.length === 0}
          iconeVazio={ShoppingCart}
          tituloVazio="Nenhuma compra vinculada"
          descVazio="Compras vinculadas a esta obra aparecerão aqui."
          acaoLabel="Ir para Compras"
          onAcao={() => router.push("/compras")}
        >
          {data.compras.map((c) => (
            <LinhaItem
              key={c.id}
              titulo={c.produto}
              subtitulo={`${c.fornecedor} · ${c.quantidade} un`}
              valor={formatMoeda(c.quantidade * c.valor_unitario)}
              badge={c.status}
            />
          ))}
        </SecaoLista>
      )}

      {aba === "materiais" && (
        <SecaoLista
          vazio={data.materiais.length === 0}
          iconeVazio={Boxes}
          tituloVazio="Sem movimentações"
          descVazio="Entradas, transferências e consumos de material aparecerão aqui."
          acaoLabel="Ir para Estoque"
          onAcao={() => router.push("/estoque")}
        >
          {data.materiais.map((m) => (
            <LinhaItem
              key={m.id}
              titulo={m.produto}
              subtitulo={`${TIPO_MOV_LABEL[m.tipo] ?? m.tipo} · ${formatData(m.criado_em)}`}
              valor={`${m.quantidade} un`}
              badge={TIPO_MOV_LABEL[m.tipo] ?? m.tipo}
            />
          ))}
        </SecaoLista>
      )}

      {aba === "equipe" && (
        <SecaoLista
          vazio={data.equipe.length === 0}
          iconeVazio={Users}
          tituloVazio="Ninguém alocado"
          descVazio="Aloque funcionários a esta obra pelo módulo RH."
          acaoLabel="Ir para RH"
          onAcao={() => router.push("/rh")}
        >
          {data.equipe.map((e) => (
            <LinhaItem
              key={e.alocacao_id}
              titulo={e.funcionario_nome}
              subtitulo={[e.cargo, e.funcao].filter(Boolean).join(" · ") || "—"}
              valor={formatMoeda(e.salario)}
              badge={e.ativa ? "Ativo" : "Inativo"}
            />
          ))}
        </SecaoLista>
      )}

      {aba === "diario" && (
        <SecaoLista
          vazio={data.diario.length === 0}
          iconeVazio={NotebookPen}
          tituloVazio="Diário vazio"
          descVazio="Registros do diário desta obra aparecerão aqui."
          acaoLabel="Ir para Diário de Instalação"
          onAcao={() => router.push("/diario-obra")}
        >
          {data.diario.map((d) => (
            <div key={d.id} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{formatData(d.criado_em)}</p>
              <p className="text-sm">{d.observacoes ?? "—"}</p>
            </div>
          ))}
        </SecaoLista>
      )}

      {aba === "financeiro" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">A receber</p>
                <p className="text-2xl font-bold text-gradient-green">{formatMoeda(data.financeiro.total_a_receber)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">A pagar</p>
                <p className="text-2xl font-bold text-gradient-purple">{formatMoeda(data.financeiro.total_a_pagar)}</p>
              </CardContent>
            </Card>
          </div>
          <SecaoLista
            vazio={data.financeiro.a_pagar.length === 0 && data.financeiro.a_receber.length === 0}
            iconeVazio={Wallet}
            tituloVazio="Sem lançamentos"
            descVazio="Contas vinculadas a esta obra aparecerão aqui."
            acaoLabel="Ir para Financeiro"
            onAcao={() => router.push("/financeiro")}
          >
            {data.financeiro.a_receber.map((c) => (
              <LinhaItem key={c.id} titulo={c.descricao} subtitulo={`Receber · vence ${c.vencimento ? formatData(c.vencimento) : "—"}`} valor={formatMoeda(c.valor)} badge={c.status} corValor="text-green-600" />
            ))}
            {data.financeiro.a_pagar.map((c) => (
              <LinhaItem key={c.id} titulo={c.descricao} subtitulo={`Pagar · vence ${c.vencimento ? formatData(c.vencimento) : "—"}`} valor={formatMoeda(c.valor)} badge={c.status} corValor="text-red-600" />
            ))}
          </SecaoLista>
        </div>
      )}

      {aba === "documentos" && (
        <SecaoLista
          vazio={data.documentos.length === 0}
          iconeVazio={FileArchive}
          tituloVazio="Sem documentos"
          descVazio="Documentos vinculados a esta obra aparecerão aqui."
          acaoLabel="Ir para Documentos"
          onAcao={() => router.push("/documentos")}
        >
          {data.documentos.map((d) => (
            <a key={d.id} href={d.arquivo_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50">
              <span className="flex items-center gap-2"><FileArchive className="h-4 w-4 text-muted-foreground" />{d.nome}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          ))}
        </SecaoLista>
      )}

      {aba === "resultado" && <ResultadoObraCard obraId={obra.id} />}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

interface LinhaItemProps {
  titulo: string; subtitulo: string; valor: string; badge?: string; corValor?: string;
}

function LinhaItem({ titulo, subtitulo, valor, badge, corValor }: LinhaItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{titulo}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
        <span className={cn("text-sm font-semibold tabular-nums", corValor)}>{valor}</span>
      </div>
    </div>
  );
}

interface SecaoListaProps {
  vazio: boolean; iconeVazio: LucideIcon; tituloVazio: string; descVazio: string;
  acaoLabel: string; onAcao: () => void; children: React.ReactNode;
}

function SecaoLista({ vazio, iconeVazio, tituloVazio, descVazio, acaoLabel, onAcao, children }: SecaoListaProps) {
  return (
    <Card>
      <CardContent className={cn(vazio ? "" : "space-y-2 p-4")}>
        {vazio ? (
          <EmptyState icon={iconeVazio} title={tituloVazio} description={descVazio} actionLabel={acaoLabel} onAction={onAcao} />
        ) : (
          <>
            <div className="mb-1 flex justify-end">
              <Button variant="ghost" size="sm" onClick={onAcao}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> {acaoLabel}
              </Button>
            </div>
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
}
