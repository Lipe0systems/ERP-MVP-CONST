"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCriarLancamento } from "@/hooks/use-banco";
import { getLocalISODate } from "@/lib/format";
import type { ContaBancaria } from "@/types";

const schema = z.object({
  conta_id: z.string().min(1, "Selecione uma conta"),
  tipo: z.enum(["entrada", "saida"]),
  valor: z.coerce.number().gt(0, "Valor deve ser maior que zero"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  data: z.string().min(1),
  categoria: z.string().optional(),
  referencia: z.string().optional(),
});
type F = z.infer<typeof schema>;

export function LancamentoFormDialog({ open, onOpenChange, contas, contaPreSelecionada }: { open: boolean; onOpenChange: (v: boolean) => void; contas: ContaBancaria[]; contaPreSelecionada?: string }) {
  const criar = useCriarLancamento();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ conta_id: contaPreSelecionada ?? contas[0]?.id ?? "", tipo: "entrada", valor: undefined as any, descricao: "", data: getLocalISODate(), categoria: "", referencia: "" });
  }, [open, contaPreSelecionada, contas, reset]);

  async function onSubmit(values: F) {
    try {
      await criar.mutateAsync({ ...values, categoria: values.categoria || null, referencia: values.referencia || null });
      onOpenChange(false);
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Conta *</Label>
            <select {...register("conta_id")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {errors.conta_id && <p className="text-xs text-destructive">{errors.conta_id.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <select {...register("tipo")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input id="valor" type="number" step="0.01" placeholder="" {...register("valor")} />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" {...register("descricao")} />
            {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input id="data" type="date" {...register("data")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" {...register("categoria")} placeholder="Ex.: Aluguel" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referencia">Referência</Label>
            <Input id="referencia" {...register("referencia")} placeholder="Nº nota, orçamento..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={criar.isPending}>{criar.isPending ? "Salvando..." : "Registrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
