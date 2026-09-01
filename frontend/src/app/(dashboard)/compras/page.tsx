"use client";

import { useState } from "react";
import { CheckSquare, FileDown, Package, PackageCheck, Pencil, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { CompraFormDialog } from "@/components/compras/compra-form-dialog";
import { StatusCompraBadge } from "@/components/compras/status-compra-badge";
import { useAprovarCompra, useCompras, useReceberCompra, useRemoverCompra } from "@/hooks/use-compras";
import { baixarRelatorioCompras } from "@/lib/api/relatorios";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { formatData, formatMoeda } from "@/lib/format";
import { STATUS_COMPRA, type CompraListItem, type StatusCompra } from "@/types";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<StatusCompra, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  recebida: "Recebida",
  cancelada: "Cancelada",
};

export default function ComprasPage() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusCompra | "todos">("todos");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [compraEditando, setCompraEditando] = useState<CompraListItem | null>(null);
  const [compraRemovendo, setCompraRemovendo] = useState<CompraListItem | null>(null);

  const search = useDebounce(searchInput, 400);
  const remover = useRemoverCompra();
  const receber = useReceberCompra();
  const aprovar = useAprovarCompra();

  const { data, isLoading, isError, isFetching } = useCompras({
    search,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const compras = data?.items ?? [];
  const emptyState = !isLoading && compras.length === 0;

  function handleNovo() {
    setCompraEditando(null);
    setFormOpen(true);
  }

  function handleEditar(compra: CompraListItem) {
    setCompraEditando(compra);
    setFormOpen(true);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value);
    setPage(1);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStatus(e.target.value as StatusCompra | "todos");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={ShoppingCart} title="Compras" subtitle="Materiais e insumos usados nas instalações" cor="purple">
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Nova compra
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Buscar por produto ou fornecedor..."
            className="pl-9"
          />
        </div>
        <Select value={status} onChange={handleStatusChange} className="sm:w-48">
          <option value="todos">Todos os status</option>
          {STATUS_COMPRA.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Não foi possível carregar as compras. Tente novamente em instantes.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : emptyState ? (
        <EmptyState
          icon={Package}
          title="Nenhuma compra encontrada"
          description={search || status !== "todos" ? "Tente ajustar os filtros." : "Comece cadastrando uma compra."}
          actionLabel={!search && status === "todos" ? "Nova compra" : undefined}
          onAction={!search && status === "todos" ? handleNovo : undefined}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">Fornecedor</TableHead>
                <TableHead className="hidden md:table-cell">Instalação</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60 transition-opacity" : undefined}>
              {compras.map((compra) => (
                <TableRow key={compra.id}>
                  <TableCell className="font-medium">
                    {compra.produto}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({compra.quantidade}
                      {compra.unidade ? ` ${compra.unidade}` : ""})
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {compra.fornecedor}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {compra.obra_nome || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatData(compra.data_compra)}</TableCell>
                  <TableCell>
                    <StatusCompraBadge status={compra.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatMoeda(compra.valor_total)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {compra.status === "pendente" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Aprovar — gera Conta a Pagar automaticamente"
                          onClick={() => aprovar.mutate(compra.id)}
                          disabled={aprovar.isPending}
                          aria-label="Aprovar compra"
                        >
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {(compra.status === "pendente" || compra.status === "aprovada") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Receber — dá entrada automática no estoque"
                          onClick={() => receber.mutate(compra.id)}
                          disabled={receber.isPending}
                          aria-label={`Receber ${compra.produto} e dar entrada no estoque`}
                        >
                          <PackageCheck className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditar(compra)}
                        aria-label={`Editar ${compra.produto}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCompraRemovendo(compra)}
                        aria-label={`Remover ${compra.produto}`}
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

      <CompraFormDialog open={formOpen} onOpenChange={setFormOpen} compra={compraEditando} />
      <DeleteConfirmDialog
        titulo="Remover compra"
        open={Boolean(compraRemovendo)}
        onOpenChange={(open) => !open && setCompraRemovendo(null)}
        descricao={compraRemovendo?.produto}
        isPending={remover.isPending}
        onConfirm={() => {
          if (compraRemovendo) return remover.mutateAsync(compraRemovendo.id);
        }}
      />
    </div>
  );
}
