"use client";

import { useState } from "react";
import { ClipboardList, Edit, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { AtendimentoFormDialog } from "@/components/atendimentos/atendimento-form-dialog";
import { useAtendimentos, useRemoverAtendimento } from "@/hooks/use-atendimentos";
import { useDebounce } from "@/hooks/use-debounce";
import { formatData } from "@/lib/format";
import { STATUS_ATENDIMENTO, STATUS_ATENDIMENTO_LABEL, TIPO_ATENDIMENTO_LABEL } from "@/types";
import type { AtendimentoListItem, StatusAtendimento } from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<StatusAtendimento, string> = {
  agendado: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  realizado: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function AtendimentosPage() {
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusAtendimento | "todos">("todos");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<AtendimentoListItem | null>(null);
  const [removendo, setRemovendo] = useState<AtendimentoListItem | null>(null);

  const { data, isLoading } = useAtendimentos({
    status: statusFiltro === "todos" ? undefined : statusFiltro,
    page,
    pageSize: PAGE_SIZE,
  });
  const remover = useRemoverAtendimento();

  const atendimentos = data?.items ?? [];
  const total = data?.total ?? 0;
  const emptyState = !isLoading && atendimentos.length === 0;

  function handleNovo() { setEditando(null); setFormOpen(true); }
  function handleEditar(a: AtendimentoListItem) { setEditando(a); setFormOpen(true); }

  return (
    <div className="space-y-6">
      <PageHeader icon={ClipboardList} title="Atendimentos" subtitle="Visitas, inspeções e entregas de obra" cor="blue">
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Atendimento
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => { setStatusFiltro(e.target.value as any); setPage(1); }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="todos">Todos os status</option>
          {STATUS_ATENDIMENTO.map((s) => <option key={s} value={s}>{STATUS_ATENDIMENTO_LABEL[s]}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : emptyState ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum atendimento encontrado"
          description={statusFiltro !== "todos" ? "Tente outro filtro." : "Registre o primeiro atendimento de obra."}
          actionLabel={statusFiltro === "todos" ? "Novo atendimento" : undefined}
          onAction={statusFiltro === "todos" ? handleNovo : undefined}
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Obra</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Responsável</TableHead>
                  <TableHead className="hidden md:table-cell">Checklist</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{formatData(a.data)}</TableCell>
                    <TableCell className="font-medium">{a.cliente_nome}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{a.obra_nome ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">{TIPO_ATENDIMENTO_LABEL[a.tipo]}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[a.status])}>
                        {STATUS_ATENDIMENTO_LABEL[a.status]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{a.responsavel ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {a.checklist.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {a.checklist_ok.length}/{a.checklist.length}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditar(a)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setRemovendo(a)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      <AtendimentoFormDialog open={formOpen} onOpenChange={setFormOpen} atendimento={editando} />
      <DeleteConfirmDialog
        titulo="Remover atendimento"
        open={Boolean(removendo)}
        onOpenChange={(o) => !o && setRemovendo(null)}
        descricao={removendo ? `atendimento de ${removendo.cliente_nome} em ${formatData(removendo.data)}` : undefined}
        isPending={remover.isPending}
        onConfirm={() => { if (removendo) return remover.mutateAsync(removendo.id); }}
      />
    </div>
  );
}
