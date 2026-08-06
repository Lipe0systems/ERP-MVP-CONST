"use client";

import { useState } from "react";
import {
  Check,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  X as XIcon,
  Undo2,
  Trash2,
  Edit,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { OrcamentoFormDialog } from "@/components/orcamentos/orcamento-form-dialog";
import { OrcamentoStatusBadge } from "@/components/orcamentos/orcamento-status-badge";
import {
  useOrcamentos,
  useAprovarOrcamento,
  useRecusarOrcamento,
  useCancelarOrcamento,
  useRemoverOrcamento,
} from "@/hooks/use-orcamentos";
import { useClientes } from "@/hooks/use-clientes";
import { formatMoeda, formatData } from "@/lib/format";
import type { OrcamentoListItem, StatusOrcamento } from "@/types";

const PAGE_SIZE = 10;

export default function OrcamentosPage() {
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusOrcamento | "todos">("todos");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<OrcamentoListItem | null>(null);

  const { data, isLoading } = useOrcamentos({
    search,
    status: statusFiltro,
    page,
    pageSize: PAGE_SIZE,
  });

  const aprovar = useAprovarOrcamento();
  const recusar = useRecusarOrcamento();
  const cancelar = useCancelarOrcamento();
  const remover = useRemoverOrcamento();

  const orcamentos = data?.items ?? [];
  const total = data?.total ?? 0;
  const emptyState = !isLoading && orcamentos.length === 0;

  function handleNovo() {
    setEditandoId(null);
    setFormOpen(true);
  }

  function handleEditar(orc: OrcamentoListItem) {
    setEditandoId(orc.id);
    setFormOpen(true);
  }

  function handleWhatsApp(orc: OrcamentoListItem) {
    // Busca o telefone do cliente — usa a listagem de clientes que já está em cache
    // (carregada pelo formulário). Se não achar, abre sem número.
    const url = `https://wa.me/?text=${encodeURIComponent(
      `Olá! Segue o orçamento #${orc.numero} no valor de ${formatMoeda(orc.valor_total)}. Aguardo sua aprovação.`
    )}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
            Geração, aprovação e acompanhamento de orçamentos
          </p>
        </div>
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => {
            setStatusFiltro(e.target.value as StatusOrcamento | "todos");
            setPage(1);
          }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="todos">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="aprovado">Aprovado</option>
          <option value="recusado">Recusado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Nº</TableHead>
              <TableHead scope="col">Cliente</TableHead>
              <TableHead scope="col">Obra</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" className="text-right">Valor</TableHead>
              <TableHead scope="col">Itens</TableHead>
              <TableHead scope="col">Data</TableHead>
              <TableHead scope="col" className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}

            {emptyState && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            )}

            {orcamentos.map((orc) => (
              <TableRow key={orc.id}>
                <TableCell className="font-medium">#{orc.numero}</TableCell>
                <TableCell>{orc.cliente_nome}</TableCell>
                <TableCell>{orc.obra_nome ?? "—"}</TableCell>
                <TableCell>
                  <OrcamentoStatusBadge status={orc.status as StatusOrcamento} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoeda(orc.valor_total)}
                </TableCell>
                <TableCell>{orc.qtd_itens}</TableCell>
                <TableCell>{formatData(orc.criado_em)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Ações condicionais ao status */}
                    {orc.status === "rascunho" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => handleEditar(orc)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Aprovar"
                          onClick={() => aprovar.mutate(orc.id)}
                          disabled={aprovar.isPending}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Recusar"
                          onClick={() => recusar.mutate(orc.id)}
                          disabled={recusar.isPending}
                        >
                          <XIcon className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          onClick={() => setRemovendo(orc)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    {orc.status === "aprovado" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Cancelar orçamento (estorna estoque)"
                        onClick={() => cancelar.mutate(orc.id)}
                        disabled={cancelar.isPending}
                      >
                        <Undo2 className="h-4 w-4 text-amber-600" />
                      </Button>
                    )}
                    {orc.status === "recusado" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir"
                        onClick={() => setRemovendo(orc)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {/* WhatsApp — disponível em todos os status */}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Enviar por WhatsApp"
                      onClick={() => handleWhatsApp(orc)}
                    >
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <OrcamentoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        orcamentoId={editandoId}
      />

      <DeleteConfirmDialog
        titulo="Remover orçamento"
        open={Boolean(removendo)}
        onOpenChange={(open) => !open && setRemovendo(null)}
        descricao={removendo ? `o orçamento #${removendo.numero}` : undefined}
        isPending={remover.isPending}
        onConfirm={() => {
          if (removendo) return remover.mutateAsync(removendo.id);
        }}
      />
    </div>
  );
}
