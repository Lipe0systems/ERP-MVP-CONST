"use client";

import React, { useState } from "react";
import { Pencil, Plus, Receipt, Search, Trash2, CheckCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/pagination";
import { StatusContaBadge } from "@/components/financeiro/status-conta-badge";
import { ContaPagarFormDialog } from "@/components/financeiro/conta-pagar-form-dialog";
import { PagarReceberDialog } from "@/components/financeiro/pagar-receber-dialog";
import { LoteLiquidarDialog } from "@/components/financeiro/lote-liquidar-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useContasPagar, useRemoverContaPagar, useCancelarContaPagar } from "@/hooks/use-financeiro";
import { useDebounce } from "@/hooks/use-debounce";
import { formatData, formatMoeda } from "@/lib/format";
import { STATUS_CONTA, type ContaPagarListItem, type StatusConta } from "@/types";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<StatusConta, string> = {
  pendente: "Pendente",
  liquidado: "Pago",
  cancelado: "Cancelado",
};

export function ContasPagarTable() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusConta | "todos">("todos");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [contaEditando, setContaEditando] = useState<ContaPagarListItem | null>(null);
  const [contaRemovendo, setContaRemovendo] = useState<ContaPagarListItem | null>(null);

  const search = useDebounce(searchInput, 400);
  const remover = useRemoverContaPagar();
  const [pagando, setPagando] = useState<ContaPagarListItem | null>(null);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [loteOpen, setLoteOpen] = useState(false);
  const [agrupado, setAgrupado] = useState(false);
  const cancelarRapido = useCancelarContaPagar();

  const { data, isLoading, isError, isFetching } = useContasPagar({
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

  function handleEditar(conta: ContaPagarListItem) {
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

  function toggleSelecao(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const pendentesVisiveis = contas.filter((c) => c.status === "pendente");
  const todasSelecionadas = pendentesVisiveis.length > 0 && pendentesVisiveis.every((c) => selecionadas.has(c.id));

  function toggleTodas() {
    setSelecionadas((prev) => {
      if (todasSelecionadas) return new Set();
      const next = new Set(prev);
      for (const c of pendentesVisiveis) next.add(c.id);
      return next;
    });
  }

  const grupos: [string, ContaPagarListItem[]][] = agrupado
    ? Object.entries(
        contas.reduce<Record<string, ContaPagarListItem[]>>((acc, c) => {
          const chave = c.fornecedor || "Sem fornecedor";
          (acc[chave] ??= []).push(c);
          return acc;
        }, {})
      ).sort((a, b) => a[0].localeCompare(b[0]))
    : [["", contas]];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Buscar por descrição ou fornecedor..."
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
        <div className="flex gap-2">
          <Button variant={agrupado ? "default" : "outline"} size="sm" onClick={() => setAgrupado((v) => !v)}>
            Agrupar por fornecedor
          </Button>
          <Button onClick={handleNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Nova conta
          </Button>
        </div>
      </div>

      {selecionadas.size > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-4 py-2.5">
          <p className="text-sm font-medium">{selecionadas.size} conta(s) selecionada(s)</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelecionadas(new Set())}>Limpar</Button>
            <Button size="sm" onClick={() => setLoteOpen(true)}>Pagar selecionadas</Button>
          </div>
        </div>
      )}

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Não foi possível carregar as contas a pagar. Tente novamente em instantes.
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
          <p className="font-medium">Nenhuma conta a pagar encontrada</p>
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
                <TableHead className="w-8">
                  <Checkbox checked={todasSelecionadas} onCheckedChange={toggleTodas} aria-label="Selecionar todas" />
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Fornecedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60 transition-opacity" : undefined}>
              {grupos.map(([nomeGrupo, itensGrupo]) => (
                <React.Fragment key={nomeGrupo || "default"}>
                  {agrupado && (
                    <TableRow key={`grupo-${nomeGrupo}`} className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={7} className="py-2 text-xs font-semibold text-muted-foreground">
                        {nomeGrupo} · {formatMoeda(itensGrupo.reduce((s, c) => s + c.valor, 0))}
                      </TableCell>
                    </TableRow>
                  )}
                  {itensGrupo.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell>
                    {conta.status === "pendente" && (
                      <Checkbox checked={selecionadas.has(conta.id)} onCheckedChange={() => toggleSelecao(conta.id)} aria-label={`Selecionar ${conta.descricao}`} />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{conta.descricao}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {conta.fornecedor || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatData(conta.data_vencimento)}</TableCell>
                  <TableCell>
                    <StatusContaBadge status={conta.status} dataVencimento={conta.data_vencimento} contexto="pagar" />
                  </TableCell>
                  <TableCell className="text-right">{formatMoeda(conta.valor)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {conta.status === "pendente" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Marcar como paga"
                            onClick={() => setPagando(conta)}
                            aria-label={`Marcar ${conta.descricao} como paga`}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Cancelar"
                            onClick={() => cancelarRapido.mutate(conta)}
                            disabled={cancelarRapido.isPending}
                            aria-label={`Cancelar ${conta.descricao}`}
                          >
                            <XCircle className="h-4 w-4 text-amber-600" />
                          </Button>
                        </>
                      )}
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
                </React.Fragment>
              ))}
            </TableBody>
          </Table>

          <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
        </>
      )}

      <ContaPagarFormDialog open={formOpen} onOpenChange={setFormOpen} conta={contaEditando} />
      <LoteLiquidarDialog
        open={loteOpen}
        onOpenChange={setLoteOpen}
        tipo="pagar"
        contaIds={Array.from(selecionadas)}
        onConcluido={() => setSelecionadas(new Set())}
      />
      {pagando && (
        <PagarReceberDialog
          open={Boolean(pagando)}
          onOpenChange={(o) => !o && setPagando(null)}
          tipo="pagar"
          contaId={pagando.id}
          descricao={pagando.descricao}
          valor={pagando.valor}
        />
      )}
      <DeleteConfirmDialog
        titulo="Remover conta a pagar"
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
