"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, Plus, User, FileText, ShoppingBag, HardHat } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useProcessos, useIniciarProcesso } from "@/hooks/use-workspace";
import type { FaseProcesso } from "@/lib/api/workspace";
import { formatMoeda, formatData } from "@/lib/format";
import { cn } from "@/lib/utils";

const FASE_LABEL: Record<FaseProcesso, string> = {
  cliente: "Escolhendo cliente", orcamento: "Montando orçamento",
  proposta: "Proposta pronta", venda: "Pronto para vender",
  obra: "Aguardando criar obra", concluido: "Concluído",
};

const FASE_ICON: Record<FaseProcesso, React.ElementType> = {
  cliente: User, orcamento: FileText, proposta: FileText,
  venda: ShoppingBag, obra: HardHat, concluido: HardHat,
};

const FASE_COR: Record<FaseProcesso, string> = {
  cliente: "from-blue-500 to-indigo-600",
  orcamento: "from-purple-500 to-fuchsia-600",
  proposta: "from-purple-500 to-fuchsia-600",
  venda: "from-green-500 to-emerald-600",
  obra: "from-amber-500 to-orange-600",
  concluido: "from-amber-500 to-orange-600",
};

export default function WorkspacePage() {
  const router = useRouter();
  const { data: processos, isLoading } = useProcessos(true);
  const iniciar = useIniciarProcesso();
  const [criando, setCriando] = useState(false);

  async function handleNovoProcesso() {
    setCriando(true);
    try {
      const p = await iniciar.mutateAsync({});
      router.push(`/workspace/${p.id}`);
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Briefcase} title="Workspace comercial" subtitle="Do cliente à instalação, num fluxo só" cor="purple">
        <Button onClick={handleNovoProcesso} disabled={criando} className="bg-grad-brand text-white glow-sm">
          {criando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Novo projeto
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : !processos || processos.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Briefcase}
              title="Nenhum projeto em andamento"
              description="Comece um novo projeto para guiar o processo desde o cliente até a criação da instalação."
              actionLabel="Novo projeto"
              onAction={handleNovoProcesso}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {processos.map((p) => {
            const Icon = FASE_ICON[p.fase];
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/workspace/${p.id}`)}
                className="card-vivid rounded-2xl p-5 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl tint-amber")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {FASE_LABEL[p.fase]}
                  </span>
                </div>
                <p className="mt-3 truncate text-sm font-semibold">
                  {p.cliente_nome ?? p.nome ?? "Novo projeto"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.orcamento_valor_total ? formatMoeda(p.orcamento_valor_total) : "Sem orçamento ainda"}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground/70">Iniciado em {formatData(p.criado_em)}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
