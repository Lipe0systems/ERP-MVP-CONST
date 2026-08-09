"use client";
import { useState } from "react";
import { FileDown, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { useVendas, useCancelarVenda, useBaixarPdfVenda } from "@/hooks/use-vendas";
import { formatMoeda, formatData } from "@/lib/format";
import { STATUS_VENDA, STATUS_VENDA_LABEL, FORMA_PAGAMENTO_LABEL } from "@/types";
import type { StatusVenda, VendaListItem } from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<StatusVenda, string> = {
  aberta: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  paga: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelada: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function VendasPage() {
  const [statusFiltro, setStatusFiltro] = useState<StatusVenda | "todos">("todos");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useVendas({
    status: statusFiltro === "todos" ? undefined : statusFiltro,
    page, pageSize: PAGE_SIZE,
  });
  const cancelar = useCancelarVenda();
  const baixarPdf = useBaixarPdfVenda();

  const vendas = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader icon={ShoppingBag} title="Vendas" subtitle="Geradas a partir dos orçamentos aprovados" cor="green">
        <p className="text-xs text-muted-foreground">Para criar uma venda, aprove um orçamento e clique em "Gerar Venda".</p>
      </PageHeader>

      <div className="flex gap-3">
        <select
          value={statusFiltro}
          onChange={(e) => { setStatusFiltro(e.target.value as any); setPage(1); }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="todos">Todos os status</option>
          {STATUS_VENDA.map((s) => <option key={s} value={s}>{STATUS_VENDA_LABEL[s]}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : vendas.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nenhuma venda encontrada"
          description="Aprove um orçamento e clique em 'Gerar Venda' para criar a primeira venda."
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Pagamento</TableHead>
                  <TableHead className="hidden sm:table-cell">Parcelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor líquido</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">#{v.numero.toString().padStart(4, "0")}</TableCell>
                    <TableCell>{v.cliente_nome}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{FORMA_PAGAMENTO_LABEL[v.forma_pagamento]}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{v.num_parcelas}x</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[v.status])}>
                        {STATUS_VENDA_LABEL[v.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatMoeda(v.valor_liquido)}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{formatData(v.criado_em)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Baixar PDF"
                          onClick={async () => { try { await baixarPdf.mutateAsync(v.id); } catch {} }}
                          disabled={baixarPdf.isPending}>
                          <FileDown className="h-4 w-4" />
                        </Button>
                        {v.status === "aberta" && (
                          <Button variant="ghost" size="icon" title="Cancelar venda"
                            onClick={() => cancelar.mutate(v.id)} disabled={cancelar.isPending}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
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
    </div>
  );
}
