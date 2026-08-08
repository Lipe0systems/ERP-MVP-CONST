"use client";

import Link from "next/link";

import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { DeleteClienteDialog } from "@/components/clientes/delete-cliente-dialog";
import { useClientes } from "@/hooks/use-clientes";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCpfCnpj } from "@/lib/validators";
import type { Cliente } from "@/types";

const PAGE_SIZE = 10;

export default function ClientesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteRemovendo, setClienteRemovendo] = useState<Cliente | null>(null);

  const search = useDebounce(searchInput, 400);

  const { data, isLoading, isError, isFetching } = useClientes({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const clientes = data?.items ?? [];

  const emptyState = useMemo(
    () => !isLoading && clientes.length === 0,
    [isLoading, clientes.length]
  );

  function handleNovo() {
    setClienteEditando(null);
    setFormOpen(true);
  }

  function handleEditar(cliente: Cliente) {
    setClienteEditando(cliente);
    setFormOpen(true);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value);
    setPage(1); // toda nova busca volta para a primeira página
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie os clientes da sua empresa</p>
        </div>
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Buscar por nome ou documento..."
          className="pl-9"
        />
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Não foi possível carregar os clientes. Tente novamente em instantes.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : emptyState ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={search ? "Tente ajustar sua busca." : "Comece cadastrando o primeiro cliente."}
          actionLabel={search ? undefined : "Novo cliente"}
          onAction={search ? undefined : handleNovo}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60 transition-opacity" : undefined}>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>{formatCpfCnpj(cliente.documento)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {cliente.email || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {cliente.telefone || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditar(cliente)}
                        aria-label={`Editar ${cliente.nome}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setClienteRemovendo(cliente)}
                        aria-label={`Remover ${cliente.nome}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </>
      )}

      <ClienteFormDialog open={formOpen} onOpenChange={setFormOpen} cliente={clienteEditando} />
      <DeleteClienteDialog
        open={Boolean(clienteRemovendo)}
        onOpenChange={(open) => !open && setClienteRemovendo(null)}
        cliente={clienteRemovendo}
      />
    </div>
  );
}
