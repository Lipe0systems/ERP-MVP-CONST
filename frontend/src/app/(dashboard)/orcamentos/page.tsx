"use client";

import { useState } from "react";
import {
  Check,
  FileDown,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  ShoppingBag,
  X as XIcon,
  Undo2,
  Trash2,
  Edit,
  MessageCircle,
  HardHat,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
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
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { OrcamentoFormDialog } from "@/components/orcamentos/orcamento-form-dialog";
import { OrcamentoStatusBadge } from "@/components/orcamentos/orcamento-status-badge";
import {
  useOrcamentos,
  useAprovarOrcamento,
  useAprovarOrcamentosEmLote,
  useRecusarOrcamento,
  useCancelarOrcamento,
  useRemoverOrcamento,
} from "@/hooks/use-orcamentos";
import { useClientes } from "@/hooks/use-clientes";
import { formatMoeda, formatData } from "@/lib/format";
import { baixarPdfOrcamento } from "@/lib/api/orcamentos";
import { baixarRelatorioOrcamentos } from "@/lib/api/relatorios";
import { VendaDeOrcamentoDialog } from "@/components/vendas/venda-de-orcamento-dialog";
import { CriarObraDialog } from "@/components/orcamentos/criar-obra-dialog";
import { toast } from "sonner";
import type { OrcamentoListItem, StatusOrcamento } from "@/types";

const PAGE_SIZE = 10;

export default function OrcamentosPage() {
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusOrcamento | "todos">("todos");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [vendaOrc, setVendaOrc] = useState<OrcamentoListItem | null>(null);
  const [obraOrc, setObraOrc] = useState<OrcamentoListItem | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<OrcamentoListItem | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

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
  const aprovarLote = useAprovarOrcamentosEmLote();

  const orcamentos = data?.items ?? [];
  const total = data?.total ?? 0;
  const emptyState = !isLoading && orcamentos.length === 0;
  const rascunhosVisiveis = orcamentos.filter((o) => o.status === "rascunho");

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleTodos() {
    setSelecionados((prev) =>
      prev.size === rascunhosVisiveis.length ? new Set() : new Set(rascunhosVisiveis.map((o) => o.id))
    );
  }

  async function handleAprovarLote() {
    const ids = Array.from(selecionados);
    if (ids.length === 0) return;
    try {
      await aprovarLote.mutateAsync(ids);
      setSelecionados(new Set());
    } catch {}
  }

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
      <PageHeader icon={FileText} title="Orçamentos" subtitle="Geração, aprovação e acompanhamento de orçamentos" cor="purple">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try { await baixarRelatorioOrcamentos(); } catch { toast.error("Erro ao gerar relatório."); }
            }}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Relatório PDF
          </Button>
          <Button onClick={handleNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
      </PageHeader>

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

      {/* Barra de ação em lote */}
      {selecionados.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selecionados.size} orçamento{selecionados.size > 1 ? "s" : ""} selecionado{selecionados.size > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelecionados(new Set())}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAprovarLote} disabled={aprovarLote.isPending}>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {aprovarLote.isPending ? "Aprovando..." : "Aprovar selecionados"}
            </Button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-10">
                {rascunhosVisiveis.length > 0 && (
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selecionados.size > 0 && selecionados.size === rascunhosVisiveis.length}
                    onChange={toggleTodos}
                    aria-label="Selecionar todos os rascunhos"
                  />
                )}
              </TableHead>
              <TableHead scope="col">Nº</TableHead>
              <TableHead scope="col">Cliente</TableHead>
              <TableHead scope="col" className="hidden sm:table-cell">Instalação</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" className="text-right">Valor</TableHead>
              <TableHead scope="col" className="hidden md:table-cell">Itens</TableHead>
              <TableHead scope="col" className="hidden md:table-cell">Data</TableHead>
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
                <TableCell colSpan={9} className="p-0">
                  <EmptyState
                    icon={FileText}
                    title="Nenhum orçamento encontrado"
                    description={search || statusFiltro !== "todos" ? "Tente ajustar os filtros." : "Comece criando o primeiro orçamento."}
                    actionLabel={!search && statusFiltro === "todos" ? "Novo Orçamento" : undefined}
                    onAction={!search && statusFiltro === "todos" ? handleNovo : undefined}
                  />
                </TableCell>
              </TableRow>
            )}

            {orcamentos.map((orc) => (
              <TableRow key={orc.id}>
                <TableCell>
                  {orc.status === "rascunho" && (
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selecionados.has(orc.id)}
                      onChange={() => toggleSelecionado(orc.id)}
                      aria-label={`Selecionar orçamento #${orc.numero}`}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">#{orc.numero}</TableCell>
                <TableCell>{orc.cliente_nome}</TableCell>
                <TableCell className="hidden sm:table-cell">{orc.obra_nome ?? "—"}</TableCell>
                <TableCell>
                  <OrcamentoStatusBadge status={orc.status as StatusOrcamento} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoeda(orc.valor_total)}
                </TableCell>
                <TableCell className="hidden md:table-cell">{orc.qtd_itens}</TableCell>
                <TableCell className="hidden md:table-cell">{formatData(orc.criado_em)}</TableCell>
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
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Gerar venda"
                          onClick={() => setVendaOrc(orc)}
                        >
                          <ShoppingBag className="h-4 w-4 text-green-600" />
                        </Button>
                        {!orc.obra_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Criar obra a partir deste orçamento"
                            onClick={() => setObraOrc(orc)}
                          >
                            <HardHat className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Cancelar orçamento (estorna estoque)"
                          onClick={() => cancelar.mutate(orc.id)}
                          disabled={cancelar.isPending}
                        >
                          <Undo2 className="h-4 w-4 text-amber-600" />
                        </Button>
                      </>
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
                    {/* PDF + WhatsApp — disponíveis em todos os status */}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Baixar PDF"
                      onClick={async () => {
                        try {
                          await baixarPdfOrcamento(orc.id);
                        } catch {
                          toast.error("Erro ao gerar o PDF.");
                        }
                      }}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
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

      {vendaOrc && (
        <VendaDeOrcamentoDialog
          open={Boolean(vendaOrc)}
          onOpenChange={(v) => !v && setVendaOrc(null)}
          orcamentoId={vendaOrc.id}
          orcamentoNumero={vendaOrc.numero}
          valorTotal={vendaOrc.valor_total}
        />
      )}

      {obraOrc && (
        <CriarObraDialog
          open={Boolean(obraOrc)}
          onOpenChange={(v) => !v && setObraOrc(null)}
          orcamentoId={obraOrc.id}
          orcamentoNumero={obraOrc.numero}
          valorTotal={obraOrc.valor_total}
        />
      )}

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
