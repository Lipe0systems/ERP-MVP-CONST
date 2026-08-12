"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Paperclip, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useContas } from "@/hooks/use-banco";
import { usePagarConta, useReceberConta } from "@/hooks/use-financeiro-v2";
import { uploadDocumento, validarArquivoDocumento } from "@/lib/supabase/storage-documentos";
import { formatMoeda, getLocalISODate } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: "pagar" | "receber";
  contaId: string;
  descricao: string;
  valor: number;
}

export function PagarReceberDialog({ open, onOpenChange, tipo, contaId, descricao, valor }: Props) {
  const { data: contasBancarias, isLoading: loadingContas } = useContas();
  const pagar = usePagarConta();
  const receber = useReceberConta();

  const [contaBancariaId, setContaBancariaId] = useState("");
  const [data, setData] = useState(getLocalISODate());
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  const isPending = pagar.isPending || receber.isPending || enviando;

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const erro = validarArquivoDocumento(file);
    if (erro) { toast.error(erro); return; }
    setArquivo(file);
  }

  async function handleConfirmar() {
    if (!contaBancariaId) {
      toast.error("Selecione a conta bancária.");
      return;
    }
    try {
      let comprovanteUrl: string | null = null;
      if (arquivo) {
        setEnviando(true);
        const res = await uploadDocumento("comprovantes", contaId, arquivo);
        comprovanteUrl = res.url;
        setEnviando(false);
      }

      const body = { conta_bancaria_id: contaBancariaId, data, comprovante_url: comprovanteUrl };
      if (tipo === "pagar") await pagar.mutateAsync({ id: contaId, body });
      else await receber.mutateAsync({ id: contaId, body });

      onOpenChange(false);
      setArquivo(null);
      setContaBancariaId("");
    } catch {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            {tipo === "pagar" ? "Confirmar pagamento" : "Confirmar recebimento"}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm font-medium">{descricao}</p>
          <p className="text-lg font-bold tabular-nums">{formatMoeda(valor)}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Conta bancária</Label>
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
            {!loadingContas && (contasBancarias ?? []).length === 0 && (
              <p className="text-xs text-amber-600">Nenhuma conta bancária cadastrada — cadastre uma no módulo Banco primeiro.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-liquidacao">Data</Label>
            <Input id="data-liquidacao" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Comprovante (opcional)</Label>
            {arquivo ? (
              <div className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                <span className="truncate">{arquivo.name}</span>
                <Button variant="ghost" size="sm" className="ml-auto h-6 px-2" onClick={() => setArquivo(null)}>
                  remover
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-2.5 text-sm text-muted-foreground hover:bg-muted/50">
                <Paperclip className="h-4 w-4" />
                Anexar nota fiscal, recibo ou comprovante PIX
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleArquivo} />
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirmar} disabled={isPending || !contaBancariaId}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {tipo === "pagar" ? "Confirmar pagamento" : "Confirmar recebimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
