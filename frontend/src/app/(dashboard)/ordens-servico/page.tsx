"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MapPin, Plus, Trash2, Wrench, Pencil } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrdensServico, useApagarOrdemServico } from "@/hooks/use-ordens-servico";
import { OrdemServicoFormDialog } from "@/components/ordens-servico/ordem-servico-form-dialog";
import { ConcluirOrdemServicoDialog } from "@/components/ordens-servico/concluir-ordem-servico-dialog";
import { formatData } from "@/lib/format";
import { STATUS_ORDEM_SERVICO_LABEL, type OrdemServico, type StatusOrdemServico } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_COR: Record<StatusOrdemServico, string> = {
  pendente: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  em_andamento: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  concluida: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelada: "bg-muted text-muted-foreground",
};

export default function OrdensServicoPage() {
  const { isInstalador } = useCurrentUser();
  const [statusFiltro, setStatusFiltro] = useState<StatusOrdemServico | "todas">("todas");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrdensServico({ status: statusFiltro, page, pageSize: 20 });

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<OrdemServico | null>(null);
  const [concluirOpen, setConcluirOpen] = useState(false);
  const [concluindoOrdem, setConcluindoOrdem] = useState<OrdemServico | null>(null);

  const apagar = useApagarOrdemServico();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Ordens de Serviço"
        subtitle={isInstalador ? "Seus serviços atribuídos" : "Gestão de serviços e instalações"}
        cor="brand"
      >
        {!isInstalador && (
          <Button onClick={() => { setEditando(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nova Ordem
          </Button>
        )}
      </PageHeader>

      {/* Filtro de status */}
      <div className="flex flex-wrap gap-2">
        {(["todas", "pendente", "em_andamento", "concluida", "cancelada"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFiltro(s); setPage(1); }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              statusFiltro === s ? "bg-grad-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {s === "todas" ? "Todas" : STATUS_ORDEM_SERVICO_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={isInstalador ? "Nenhuma ordem atribuída a você ainda" : "Nenhuma ordem de serviço"}
          description={isInstalador ? "Quando uma ordem for atribuída a você, ela aparece aqui." : "Crie a primeira ordem de serviço."}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((ordem) => (
            <div key={ordem.id} className="card-vivid rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    OS #{ordem.numero.toString().padStart(4, "0")}
                  </p>
                  <h3 className="truncate text-sm font-semibold">{ordem.titulo}</h3>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_COR[ordem.status])}>
                  {STATUS_ORDEM_SERVICO_LABEL[ordem.status]}
                </span>
              </div>

              {ordem.cliente_nome && <p className="text-xs text-muted-foreground">👤 {ordem.cliente_nome}</p>}
              {ordem.obra_nome && <p className="text-xs text-muted-foreground">🏗️ {ordem.obra_nome}</p>}
              {ordem.endereco && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" /> {ordem.endereco}
                </p>
              )}
              {ordem.data_agendada && (
                <p className="text-xs text-muted-foreground">📅 {formatData(ordem.data_agendada)}</p>
              )}
              {!isInstalador && ordem.instalador_nome && (
                <p className="text-xs text-muted-foreground">🔧 {ordem.instalador_nome}</p>
              )}

              {ordem.status === "concluida" && ordem.foto_conclusao_url && (
                <img src={ordem.foto_conclusao_url} alt="Foto de conclusão" className="h-24 w-full rounded-lg object-cover" />
              )}

              <div className="flex gap-2 pt-1">
                {(ordem.status === "pendente" || ordem.status === "em_andamento") && (
                  <Button
                    size="sm" className="flex-1"
                    onClick={() => { setConcluindoOrdem(ordem); setConcluirOpen(true); }}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Concluir
                  </Button>
                )}
                {!isInstalador && (
                  <>
                    <Button variant="outline" size="icon" onClick={() => { setEditando(ordem); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline" size="icon"
                      onClick={() => apagar.mutate(ordem.id)}
                      disabled={apagar.isPending}
                    >
                      {apagar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isInstalador && (
        <OrdemServicoFormDialog open={formOpen} onOpenChange={setFormOpen} ordem={editando} />
      )}
      <ConcluirOrdemServicoDialog open={concluirOpen} onOpenChange={setConcluirOpen} ordem={concluindoOrdem} />
    </div>
  );
}
