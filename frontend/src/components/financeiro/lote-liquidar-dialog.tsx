"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Layers } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useContas } from "@/hooks/use-banco";
import { usePagarLote, useReceberLote } from "@/hooks/use-financeiro-v2";
import { getLocalISODate } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: "pagar" | "receber";
  contaIds: string[];
  onConcluido: () => void;
}

export function LoteLiquidarDialog({ open, onOpenChange, tipo, contaIds, onConcluido }: Props) {
  const { data: contasBancarias, isLoading: loadingContas } = useContas();
  const pagarLote = usePagarLote();
  const receberLote = useReceberLote();

  const [contaBancariaId, setContaBancariaId] = useState("");
  const [data, setData] = useState(getLocalISODate());

  const isPending = pagarLote.isPending || receberLote.isPending;

  async function handleConfirmar() {
    if (!contaBancariaId) {
      toast.error("Selecione a conta bancária.");
      return;
    }
    try {
      const body = { conta_ids: contaIds, conta_bancaria_id: contaBancariaId, data };
      if (tipo === "pagar") await pagarLote.mutateAsync(body);
      else await receberLote.mutateAsync(body);
      onOpenChange(false);
      onConcluido();
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-600" />
            {tipo === "pagar" ? "Pagar" : "Receber"} {contaIds.length} conta{contaIds.length > 1 ? "s" : ""} em lote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Conta bancária (usada em todas as contas do lote)</Label>
            <select
              value={contaBancariaId}
              onChange={(e) => setContaBancariaId(e.target.value)}
              disabled={loadingContas}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Selecione a conta...</option>
              {(contasBancarias ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="data-lote">Data</Label>
            <Input id="data-lote" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirmar} disabled={isPending || !contaBancariaId}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
