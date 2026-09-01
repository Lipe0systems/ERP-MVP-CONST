"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";
import { Eye, HardHat, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { ObraFormDialog } from "@/components/obras/obra-form-dialog";
import { DeleteObraDialog } from "@/components/obras/delete-obra-dialog";
import { ObraStatusBadge } from "@/components/obras/obra-status-badge";
import { useObras } from "@/hooks/use-obras";
import { useDebounce } from "@/hooks/use-debounce";
import { formatData, formatMoeda } from "@/lib/format";
import { OBRA_STATUS, OBRA_STATUS_LABEL, type ObraListItem, type ObraStatus } from "@/types";

const PAGE_SIZE = 10;

export default function ObrasPage() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<ObraStatus | "todos">("todos");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();
  const [obraEditando, setObraEditando] = useState<ObraListItem | null>(null);
  const [obraRemovendo, setObraRemovendo] = useState<ObraListItem | null>(null);

  const search = useDebounce(searchInput, 400);

  const { data, isLoading, isError, isFetching } = useObras({
    search,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const obras = data?.items ?? [];
  const emptyState = !isLoading && obras.length === 0;

  function handleNovo() {
    setObraEditando(null);
    setFormOpen(true);
  }

  function handleEditar(obra: ObraListItem) {
    setObraEditando(obra);
    setFormOpen(true);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value);
    setPage(1);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStatus(e.target.value as ObraStatus | "todos");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={HardHat} title="Instalações" subtitle="Acompanhe as instalações da sua empresa" cor="brand">
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Nova instalação
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Buscar por instalação ou cliente..."
            className="pl-9"
          />
        </div>
        <Select value={status} onChange={handleStatusChange} className="sm:w-56">
          <option value="todos">Todos os status</option>
          {OBRA_STATUS.map((s) => (
            <option key={s} value={s}>
              {OBRA_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Não foi possível carregar as obras. Tente novamente em instantes.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : emptyState ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <HardHat className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nenhuma instalação encontrada</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {search || status !== "todos"
              ? "Tente ajustar os filtros."
              : "Comece cadastrando a primeira obra."}
          </p>
          {!search && status === "todos" && (
            <Button onClick={handleNovo} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Nova instalação
            </Button>
          )}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instalação</TableHead>
                <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Início</TableHead>
                <TableHead className="hidden md:table-cell">Previsão</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Valor previsto</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-60 transition-opacity" : undefined}>
              {obras.map((obra) => (
                <TableRow key={obra.id}>
                  <TableCell className="font-medium">{obra.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{obra.cliente_nome}</TableCell>
                  <TableCell>
                    <ObraStatusBadge status={obra.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatData(obra.data_inicio)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatData(obra.data_previsao)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                    {formatMoeda(obra.valor_previsto)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/obras/${obra.id}`)}
                        aria-label={`Ver detalhes de ${obra.nome}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditar(obra)}
                        aria-label={`Editar ${obra.nome}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setObraRemovendo(obra)}
                        aria-label={`Remover ${obra.nome}`}
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

      <ObraFormDialog open={formOpen} onOpenChange={setFormOpen} obra={obraEditando} />
      <DeleteObraDialog
        open={Boolean(obraRemovendo)}
        onOpenChange={(open) => !open && setObraRemovendo(null)}
        obra={obraRemovendo}
      />
    </div>
  );
}
