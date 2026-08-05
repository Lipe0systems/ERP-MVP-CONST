"use client";

import { useState } from "react";
import { Boxes, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/pagination";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { EstoqueFormDialog } from "@/components/estoque/estoque-form-dialog";
import { useEstoque, useRemoverItemEstoque } from "@/hooks/use-estoque";
import { useDebounce } from "@/hooks/use-debounce";
import { formatMoeda } from "@/lib/format";
import type { ItemEstoque } from "@/types";

const PAGE_SIZE = 10;

export default function EstoquePage() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemEstoque | null>(null);
  const [itemRemovendo, setItemRemovendo] = useState<ItemEstoque | null>(null);

  const search = useDebounce(searchInput, 400);
  const remover = useRemoverItemEstoque();

  const { data, isLoading, isError, isFetching } = useEstoque({ search, page, pageSize: PAGE_SIZE });

  const itens = data?.items ?? [];
  const emptyState = !isLoading && itens.length === 0;

  function handleNovo() {
    setItemEditando(null);
    setFormOpen(true);
  }

  function handleEditar(item: ItemEstoque) {
    setItemEditando(item);
    setFormOpen(true);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">Materiais disponíveis no almoxarifado</p>
        </div>
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo item
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Buscar por produto..."
          className="pl-9"
        />
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Não foi possível carregar o estoque. Tente novamente em instantes.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : emptyState ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Boxes className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nenhum item de estoque encontrado</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {search ? "Tente ajustar sua busca." : "Comece cadastrando o primeiro item."}
          </p>
          {!search && (
            <Button onClick={handleNovo} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Novo item
            </Button>
          )}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="hidden sm:table-cell">Unidade</TableHead>
                <TableHead className="text-right">Valor médio</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60 transition-opacity" : undefined}>
              {itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.produto}</TableCell>
                  <TableCell className="text-right">{item.quantidade}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {item.unidade || "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatMoeda(item.valor_medio)}
                  </TableCell>
                  <TableCell className="text-right">{formatMoeda(item.valor_total)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditar(item)}
                        aria-label={`Editar ${item.produto}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setItemRemovendo(item)}
                        aria-label={`Remover ${item.produto}`}
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

      <EstoqueFormDialog open={formOpen} onOpenChange={setFormOpen} item={itemEditando} />
      <DeleteConfirmDialog
        titulo="Remover item de estoque"
        open={Boolean(itemRemovendo)}
        onOpenChange={(open) => !open && setItemRemovendo(null)}
        descricao={itemRemovendo?.produto}
        isPending={remover.isPending}
        onConfirm={() => itemRemovendo && remover.mutateAsync(itemRemovendo.id)}
      />
    </div>
  );
}
