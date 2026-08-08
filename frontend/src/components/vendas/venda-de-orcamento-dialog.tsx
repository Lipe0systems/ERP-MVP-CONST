"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCriarVendaDeOrcamento } from "@/hooks/use-vendas";
import { FORMA_PAGAMENTO, FORMA_PAGAMENTO_LABEL } from "@/types";

const schema = z.object({
  forma_pagamento: z.enum(FORMA_PAGAMENTO),
  num_parcelas: z.coerce.number().int().min(1).max(60),
  dias_primeiro_vencimento: z.coerce.number().int().min(1).max(365),
  desconto: z.coerce.number().min(0),
  observacoes: z.string().optional(),
});
type F = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orcamentoId: string;
  orcamentoNumero: number;
  valorTotal: number;
}

export function VendaDeOrcamentoDialog({ open, onOpenChange, orcamentoId, orcamentoNumero, valorTotal }: Props) {
  const criar = useCriarVendaDeOrcamento();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { forma_pagamento: "avista", num_parcelas: 1, dias_primeiro_vencimento: 30, desconto: 0 },
  });

  const desconto = watch("desconto") || 0;
  const numParcelas = watch("num_parcelas") || 1;
  const valorLiquido = Math.max(0, valorTotal - desconto);
  const valorParcela = numParcelas > 0 ? valorLiquido / numParcelas : valorLiquido;

  async function onSubmit(values: F) {
    try {
      await criar.mutateAsync({ orcamento_id: orcamentoId, ...values, observacoes: values.observacoes || null });
      onOpenChange(false);
    } catch {}
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Venda — Orçamento #{String(orcamentoNumero).padStart(4, "0")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p>Valor do orçamento: <strong>{fmt(valorTotal)}</strong></p>
          </div>
          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <select {...register("forma_pagamento")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {FORMA_PAGAMENTO.map((f) => <option key={f} value={f}>{FORMA_PAGAMENTO_LABEL[f]}</option>)}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="num_parcelas">Nº de parcelas</Label>
              <Input id="num_parcelas" type="number" min={1} max={60} {...register("num_parcelas")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dias">Vencimento (dias)</Label>
              <Input id="dias" type="number" min={1} {...register("dias_primeiro_vencimento")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desconto">Desconto (R$)</Label>
            <Input id="desconto" type="number" step="0.01" min={0} {...register("desconto")} />
          </div>
          {/* Preview de parcelas */}
          <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
            <p>Valor líquido: <strong>{fmt(valorLiquido)}</strong></p>
            {numParcelas > 1 && <p>Valor por parcela: <strong>{fmt(valorParcela)}</strong></p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Input id="obs" {...register("observacoes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={criar.isPending}>{criar.isPending ? "Gerando..." : "Gerar venda"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
