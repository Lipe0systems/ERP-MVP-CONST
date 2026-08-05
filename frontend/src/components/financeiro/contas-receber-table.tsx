"use client";

import { useState } from "react";
import { Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/pagination";
import { StatusContaBadge } from "@/components/financeiro/status-conta-badge";
import { ContaReceberFormDialog } from "@/components/financeiro/conta-receber-form-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useContasReceber, useRemoverContaReceber } from "@/hooks/use-financeiro";
import { useDebounce } from "@/hooks/use-debounce";
import { formatData, formatMoeda } from "@/lib/format";
import { STATUS_CONTA, type ContaReceberListItem, type StatusConta } from "@/types";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<StatusConta, string> = {
  pendente: "Pendente",
  liquidado: "Recebido",
  cancelado: "Cancelado",
};

export function ContasReceberTable() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusConta | "todos">("todos");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [contaEditando, setContaEditando] = useState<ContaReceberListItem | null>(null);
  const [contaRemovendo, setContaRemovendo] = useState<ContaReceberListItem | null>(null);

  const search = useDebounce(searchInput, 400);
  const remover = useRemoverContaReceber();

  const { data, isLoading, isError, isFetching } = useContasReceber({
    search,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const contas = data?.items ?? [];
  const emptyState = !isLoading && contas.length === 0;

  function handleNovo() {
    setContaEditando(null);
    setFormOpen(true);
  }

  function handleEditar(conta: ContaReceberListItem) {
    setContaEditando(conta);
    setFormOpen(true);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value);
    setPage(1);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStatus(e.target.value as StatusConta | "todos");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Buscar por descrição..."
              className="pl-9"
            />
          </div>
          <Select value={status} onChange={handleStatusChange} className="sm:w-48">
            <option value="todos">Todos os status</option>
            {STATUS_CONTA.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Nova conta
        </Button>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Não foi possível carregar as contas a receber. Tente novamente em instantes.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : emptyState ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Receipt className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nenhuma conta a receber encontrada</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {search || status !== "todos" ? "Tente ajustar os filtros." : "Comece cadastrando um lançamento."}
          </p>
          {!search && status === "todos" && (
            <Button onClick={handleNovo} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Nova conta
            </Button>
          )}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60 transition-opacity" : undefined}>
              {contas.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell className="font-medium">{conta.descricao}</TableCell>
                  <TableCell className="text-muted-foreground">{formatData(conta.data_vencimento)}</TableCell>
                  <TableCell>
                    <StatusContaBadge
                      status={conta.status}
                      dataVencimento={conta.data_vencimento}
                      contexto="receber"
                    />
                  </TableCell>
                  <TableCell className="text-right">{formatMoeda(conta.valor)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditar(conta)}
                        aria-label={`Editar ${conta.descricao}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setContaRemovendo(conta)}
                        aria-label={`Remover ${conta.descricao}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
        </>
      )}

      <ContaReceberFormDialog open={formOpen} onOpenChange={setFormOpen} conta={contaEditando} />
      <DeleteConfirmDialog
        titulo="Remover conta a receber"
        open={Boolean(contaRemovendo)}
        onOpenChange={(open) => !open && setContaRemovendo(null)}
        descricao={contaRemovendo?.descricao}
        isPending={remover.isPending}
        onConfirm={() => {
          if (contaRemovendo) return remover.mutateAsync(contaRemovendo.id);
        }}
      />
    </div>
  );
}
