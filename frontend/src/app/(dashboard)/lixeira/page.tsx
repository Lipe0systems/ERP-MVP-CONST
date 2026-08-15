"use client";

import { useState } from "react";
import {
  Trash2, RotateCcw, AlertTriangle, Clock, Loader2, Inbox,
  Users, HardHat, Truck, FileText, ShoppingBag, ShoppingCart,
  Boxes, Wallet, Landmark, ClipboardList, NotebookPen, FileArchive, Briefcase,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  useResumoLixeira, useDeletados, useRestaurar, useApagarDefinitivo, useExpurgar,
} from "@/hooks/use-lixeira";
import { formatData } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONE_MODULO: Record<string, React.ElementType> = {
  clientes: Users, obras: HardHat, fornecedores: Truck, orcamentos: FileText,
  vendas: ShoppingBag, compras: ShoppingCart, estoque: Boxes,
  contas_pagar: Wallet, contas_receber: Wallet, contas_bancarias: Landmark,
  atendimentos: ClipboardList, diario_obra: NotebookPen, documentos: FileArchive,
  funcionarios: Briefcase,
};

export default function LixeiraPage() {
  const { data: resumo, isLoading } = useResumoLixeira();
  const [moduloAberto, setModuloAberto] = useState<string | null>(null);
  const { data: lista, isLoading: loadingLista } = useDeletados(moduloAberto);
  const restaurar = useRestaurar();
  const apagar = useApagarDefinitivo();
  const expurgar = useExpurgar();

  const [apagarItem, setApagarItem] = useState<{ modulo: string; id: string; titulo: string } | null>(null);
  const [confirmExpurgar, setConfirmExpurgar] = useState(false);

  const modulos = resumo?.modulos ?? [];
  const diasExpurgo = resumo?.dias_expurgo ?? 30;

  return (
    <div className="space-y-6">
      <PageHeader icon={Trash2} title="Lixeira" subtitle={`Itens excluídos são removidos automaticamente após ${diasExpurgo} dias`} cor="red">
        {(resumo?.total ?? 0) > 0 && (
          <Button variant="outline" size="sm" onClick={() => setConfirmExpurgar(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Esvaziar antigos
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : modulos.length === 0 ? (
        <Card className="card-vivid">
          <CardContent>
            <EmptyState icon={Inbox} title="Lixeira vazia" description="Nada foi excluído recentemente. Itens que você apagar aparecerão aqui e poderão ser restaurados." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modulos.map((m) => {
            const Icone = ICONE_MODULO[m.modulo] ?? Trash2;
            const aberto = moduloAberto === m.modulo;
            return (
              <button
                key={m.modulo}
                onClick={() => setModuloAberto(aberto ? null : m.modulo)}
                className={cn(
                  "card-vivid flex items-center gap-3 rounded-2xl p-4 text-left transition-all",
                  aberto && "ring-2 ring-red-500"
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl tint-red">
                  <Icone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.quantidade} item{m.quantidade > 1 ? "ns" : ""} na lixeira</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Lista de itens do módulo aberto */}
      {moduloAberto && (
        <Card className="card-vivid">
          <CardContent className="p-0">
            {loadingLista ? (
              <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (lista?.itens.length ?? 0) === 0 ? (
              <EmptyState icon={Inbox} title="Nada aqui" description="Este módulo não tem mais itens na lixeira." />
            ) : (
              <div className="divide-y">
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm font-semibold">{lista?.label}</p>
                  <span className="text-xs text-muted-foreground">{lista?.itens.length} item(ns)</span>
                </div>
                {lista?.itens.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.titulo}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Excluído em {formatData(item.deletado_em)} ·{" "}
                        <span className={cn(item.dias_restantes <= 7 ? "text-red-500 font-medium" : "")}>
                          {item.dias_restantes} dia{item.dias_restantes !== 1 ? "s" : ""} restante{item.dias_restantes !== 1 ? "s" : ""}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => restaurar.mutate({ modulo: moduloAberto, id: item.id })}
                      disabled={restaurar.isPending}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Restaurar
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => setApagarItem({ modulo: moduloAberto, id: item.id, titulo: item.titulo })}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmar apagar definitivo */}
      <DeleteConfirmDialog
        titulo="Apagar permanentemente"
        open={Boolean(apagarItem)}
        onOpenChange={(o) => !o && setApagarItem(null)}
        descricao={apagarItem ? `"${apagarItem.titulo}" será apagado de vez. Esta ação NÃO pode ser desfeita.` : undefined}
        isPending={apagar.isPending}
        onConfirm={async () => { if (apagarItem) { await apagar.mutateAsync({ modulo: apagarItem.modulo, id: apagarItem.id }); setApagarItem(null); } }}
      />

      {/* Confirmar expurgo */}
      <DeleteConfirmDialog
        titulo="Esvaziar itens antigos"
        open={confirmExpurgar}
        onOpenChange={setConfirmExpurgar}
        descricao={`Todos os itens na lixeira há mais de ${diasExpurgo} dias serão apagados permanentemente.`}
        isPending={expurgar.isPending}
        onConfirm={async () => { await expurgar.mutateAsync(); setConfirmExpurgar(false); }}
      />
    </div>
  );
}
