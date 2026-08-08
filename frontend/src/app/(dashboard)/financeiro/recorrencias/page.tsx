"use client";

import { useState } from "react";
import { ArrowLeft, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { RecorrenciaFormDialog } from "@/components/recorrencias/recorrencia-form-dialog";
import { useRecorrencias, useRemoverRecorrencia, useGerarPendentes } from "@/hooks/use-recorrencias";
import { formatMoeda, formatData } from "@/lib/format";
import { TIPO_RECORRENCIA_LABEL } from "@/types";
import type { RecorrenciaFinanceira } from "@/types";
import { cn } from "@/lib/utils";

export default function RecorrenciasPage() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<RecorrenciaFinanceira | null>(null);
  const [removendo, setRemovendo] = useState<RecorrenciaFinanceira | null>(null);

  const { data: recorrencias = [], isLoading } = useRecorrencias();
  const remover = useRemoverRecorrencia();
  const gerarPendentes = useGerarPendentes();

  function handleNovo() { setEditando(null); setFormOpen(true); }
  function handleEditar(r: RecorrenciaFinanceira) { setEditando(r); setFormOpen(true); }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/financeiro")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Contas Fixas / Recorrências</h1>
            <p className="text-sm text-muted-foreground">Aluguel, água, luz e outras contas mensais</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => gerarPendentes.mutate(1)}
            disabled={gerarPendentes.isPending}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", gerarPendentes.isPending && "animate-spin")} />
            Gerar pendentes
          </Button>
          <Button onClick={handleNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Recorrência
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : recorrencias.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="Nenhuma recorrência cadastrada"
          description="Cadastre contas fixas como aluguel, água e luz para gerar as contas automaticamente todo mês."
          actionLabel="Nova recorrência"
          onAction={handleNovo}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="hidden md:table-cell">Última geração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recorrencias.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.descricao}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{TIPO_RECORRENCIA_LABEL[r.tipo]}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">Dia {r.dia_vencimento}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoeda(r.valor)}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {r.ultima_geracao ? formatData(r.ultima_geracao) : "Nunca"}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      r.ativo ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    )}>
                      {r.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditar(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setRemovendo(r)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RecorrenciaFormDialog open={formOpen} onOpenChange={setFormOpen} recorrencia={editando} />
      <DeleteConfirmDialog
        titulo="Remover recorrência"
        open={Boolean(removendo)}
        onOpenChange={(o) => !o && setRemovendo(null)}
        descricao={removendo?.descricao}
        isPending={remover.isPending}
        onConfirm={() => { if (removendo) return remover.mutateAsync(removendo.id); }}
      />
    </div>
  );
}
