"use client";

import { useState } from "react";
import {
  ArrowDownCircle, ArrowUpCircle, Landmark, Pencil,
  Plus, Trash2, TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ContaFormDialog } from "@/components/banco/conta-form-dialog";
import { LancamentoFormDialog } from "@/components/banco/lancamento-form-dialog";
import { useContas, useLancamentos, useRemoverConta, useRemoverLancamento, useSaldoTotal } from "@/hooks/use-banco";
import { formatMoeda, formatData } from "@/lib/format";
import type { ContaBancaria, LancamentoBancario, TIPO_CONTA_LABEL } from "@/types";
import { TIPO_CONTA_LABEL as LABEL } from "@/types";

const PAGE_SIZE = 15;

export default function BancoPage() {
  const [contaSelecionada, setContaSelecionada] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [contaFormOpen, setContaFormOpen] = useState(false);
  const [contaEditando, setContaEditando] = useState<ContaBancaria | null>(null);
  const [lancFormOpen, setLancFormOpen] = useState(false);
  const [removendoConta, setRemovendoConta] = useState<ContaBancaria | null>(null);
  const [removendoLanc, setRemovendoLanc] = useState<LancamentoBancario | null>(null);

  const { data: contas = [], isLoading: loadingContas } = useContas();
  const { data: saldoData } = useSaldoTotal();
  const { data: lancsData, isLoading: loadingLancs } = useLancamentos({
    conta_id: contaSelecionada,
    page,
    pageSize: PAGE_SIZE,
  });

  const removerConta = useRemoverConta();
  const removerLanc = useRemoverLancamento();

  const lancamentos = lancsData?.items ?? [];
  const totalLancs = lancsData?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader icon={Landmark} title="Banco" subtitle="Contas bancárias e lançamentos" cor="cyan">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setContaEditando(null); setContaFormOpen(true); }}>
            <Landmark className="mr-2 h-4 w-4" />
            Nova conta
          </Button>
          <Button onClick={() => setLancFormOpen(true)} disabled={contas.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Lançamento
          </Button>
        </div>
      </PageHeader>

      {/* Saldo total */}
      {saldoData && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">Saldo total em caixa</span>
            </div>
            <span className={`text-xl font-bold ${saldoData.total >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatMoeda(saldoData.total)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Cards de contas */}
      {loadingContas ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : contas.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhuma conta cadastrada"
          description="Cadastre uma conta bancária ou caixa para registrar lançamentos."
          actionLabel="Nova conta"
          onAction={() => { setContaEditando(null); setContaFormOpen(true); }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contas.map((conta) => (
            <Card
              key={conta.id}
              className={`cursor-pointer transition-all ${contaSelecionada === conta.id ? "ring-2 ring-amber-500" : "hover:border-muted-foreground/30"}`}
              onClick={() => { setContaSelecionada(conta.id === contaSelecionada ? undefined : conta.id); setPage(1); }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">{conta.nome}</CardTitle>
                    <p className="text-xs text-muted-foreground">{LABEL[conta.tipo]}{conta.banco ? ` · ${conta.banco}` : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setContaEditando(conta); setContaFormOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setRemovendoConta(conta); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-lg font-bold ${conta.saldo_atual >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {formatMoeda(conta.saldo_atual)}
                </p>
                <p className="text-xs text-muted-foreground">Saldo inicial: {formatMoeda(conta.saldo_inicial)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lançamentos */}
      {contas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {contaSelecionada ? `Lançamentos — ${contas.find((c) => c.id === contaSelecionada)?.nome}` : "Todos os lançamentos"}
          </h2>

          {loadingLancs ? (
            <Skeleton className="h-40 w-full rounded-md" />
          ) : lancamentos.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Nenhum lançamento"
              description="Registre entradas e saídas para acompanhar o saldo."
              actionLabel="Novo lançamento"
              onAction={() => setLancFormOpen(true)}
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentos.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{formatData(l.data)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {l.tipo === "entrada"
                              ? <ArrowDownCircle className="h-4 w-4 shrink-0 text-green-600" />
                              : <ArrowUpCircle className="h-4 w-4 shrink-0 text-destructive" />}
                            <span className="text-sm">{l.descricao}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{l.categoria ?? "—"}</TableCell>
                        <TableCell className={`text-right font-medium ${l.tipo === "entrada" ? "text-green-600" : "text-destructive"}`}>
                          {l.tipo === "entrada" ? "+" : "-"}{formatMoeda(l.valor)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setRemovendoLanc(l)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={totalLancs} onPageChange={setPage} />
            </>
          )}
        </div>
      )}

      <ContaFormDialog open={contaFormOpen} onOpenChange={setContaFormOpen} conta={contaEditando} />
      <LancamentoFormDialog open={lancFormOpen} onOpenChange={setLancFormOpen} contas={contas} contaPreSelecionada={contaSelecionada} />

      <DeleteConfirmDialog
        titulo="Remover conta"
        open={Boolean(removendoConta)}
        onOpenChange={(o) => !o && setRemovendoConta(null)}
        descricao={removendoConta?.nome}
        isPending={removerConta.isPending}
        onConfirm={() => { if (removendoConta) return removerConta.mutateAsync(removendoConta.id); }}
      />
      <DeleteConfirmDialog
        titulo="Remover lançamento"
        open={Boolean(removendoLanc)}
        onOpenChange={(o) => !o && setRemovendoLanc(null)}
        descricao={removendoLanc?.descricao}
        isPending={removerLanc.isPending}
        onConfirm={() => { if (removendoLanc) return removerLanc.mutateAsync(removendoLanc.id); }}
      />
    </div>
  );
}
