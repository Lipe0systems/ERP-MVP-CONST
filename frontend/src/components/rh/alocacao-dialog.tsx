"use client";

import { useState } from "react";
import { Building2, Plus, Trash2, Loader2, HardHat } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useObras } from "@/hooks/use-obras";
import { useAlocacoes, useCriarAlocacao, useRemoverAlocacao } from "@/hooks/use-rh";
import type { Funcionario } from "@/types";
import { formatData, getLocalISODate } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  funcionario: Funcionario | null;
}

export function AlocacaoDialog({ open, onOpenChange, funcionario }: Props) {
  const { data: alocacoes, isLoading } = useAlocacoes(
    funcionario ? { funcionario_id: funcionario.id } : undefined
  );
  const { data: obrasData } = useObras({ search: "", status: "todos", page: 1, pageSize: 100, enabled: open });
  const criar = useCriarAlocacao();
  const remover = useRemoverAlocacao();

  const [obraId, setObraId] = useState("");
  const [funcao, setFuncao] = useState("");
  const [dataInicio, setDataInicio] = useState(getLocalISODate());

  const obras = obrasData?.items ?? [];
  const alocacoesFunc = alocacoes ?? [];

  async function adicionar() {
    if (!funcionario || !obraId) {
      toast.error("Selecione uma instalação.");
      return;
    }
    try {
      await criar.mutateAsync({
        funcionario_id: funcionario.id,
        obra_id: obraId,
        data_inicio: dataInicio,
        funcao: funcao || null,
        ativa: true,
      });
      setObraId(""); setFuncao("");
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Alocações — {funcionario?.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Nova alocação */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Alocar em uma obra</p>
            <div className="space-y-2">
              <Label>Instalação</Label>
              <select
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Selecione a obra...</option>
                {obras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="funcao">Função na obra</Label>
                <Input id="funcao" value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inicio">Início</Label>
                <Input id="inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
            </div>
            <Button size="sm" onClick={adicionar} disabled={criar.isPending} className="w-full">
              {criar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Alocar
            </Button>
          </div>

          {/* Alocações existentes */}
          <div>
            <p className="mb-2 text-sm font-medium">Instalações atuais</p>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : alocacoesFunc.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Building2 className="h-7 w-7 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Ainda não está alocado em nenhuma obra.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alocacoesFunc.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-grad-brand text-white">
                      <HardHat className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.obra_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.funcao ? `${a.funcao} · ` : ""}desde {formatData(a.data_inicio)}
                      </p>
                    </div>
                    {a.ativa && <Badge variant="success">Ativa</Badge>}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remover.mutate(a.id)} disabled={remover.isPending}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
