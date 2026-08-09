"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { FornecedorFormDialog } from "@/components/fornecedores/fornecedor-form-dialog";
import { useFornecedores, useRemoverFornecedor } from "@/hooks/use-fornecedores";
import { useDebounce } from "@/hooks/use-debounce";
import type { Fornecedor } from "@/types";

const PAGE_SIZE = 10;

export default function FornecedoresPage() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [removendo, setRemovendo] = useState<Fornecedor | null>(null);

  const search = useDebounce(searchInput, 400);
  const { data, isLoading } = useFornecedores({ search, page, pageSize: PAGE_SIZE });
  const remover = useRemoverFornecedor();

  const fornecedores = data?.items ?? [];
  const total = data?.total ?? 0;
  const emptyState = !isLoading && fornecedores.length === 0;

  function handleNovo() { setEditando(null); setFormOpen(true); }
  function handleEditar(f: Fornecedor) { setEditando(f); setFormOpen(true); }

  return (
    <div className="space-y-6">
      <PageHeader icon={Truck} title="Fornecedores" subtitle="Cadastro e gestão de fornecedores" cor="green">
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : emptyState ? (
        <EmptyState
          icon={Truck}
          title="Nenhum fornecedor encontrado"
          description={search ? "Tente ajustar sua busca." : "Comece cadastrando o primeiro fornecedor."}
          actionLabel={search ? undefined : "Novo fornecedor"}
          onAction={search ? undefined : handleNovo}
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">CNPJ/CPF</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="hidden sm:table-cell">{f.documento || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{f.email || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{f.telefone || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => handleEditar(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Remover" onClick={() => setRemovendo(f)}>
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

      <FornecedorFormDialog open={formOpen} onOpenChange={setFormOpen} fornecedor={editando} />
      <DeleteConfirmDialog
        titulo="Remover fornecedor"
        open={Boolean(removendo)}
        onOpenChange={(open) => !open && setRemovendo(null)}
        descricao={removendo?.nome}
        isPending={remover.isPending}
        onConfirm={() => { if (removendo) return remover.mutateAsync(removendo.id); }}
      />
    </div>
  );
}
