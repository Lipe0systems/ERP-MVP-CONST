"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAtualizarConta, useCriarConta } from "@/hooks/use-banco";
import { TIPO_CONTA, TIPO_CONTA_LABEL, type ContaBancaria } from "@/types";

const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  numero_conta: z.string().optional(),
  tipo: z.enum(TIPO_CONTA),
  saldo_inicial: z.coerce.number(),
  observacoes: z.string().optional(),
});
type F = z.infer<typeof schema>;

export function ContaFormDialog({ open, onOpenChange, conta }: { open: boolean; onOpenChange: (v: boolean) => void; conta?: ContaBancaria | null }) {
  const criar = useCriarConta();
  const atualizar = useAtualizarConta();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset(conta ? { nome: conta.nome, banco: conta.banco ?? "", agencia: conta.agencia ?? "", numero_conta: conta.numero_conta ?? "", tipo: conta.tipo, saldo_inicial: conta.saldo_inicial, observacoes: conta.observacoes ?? "" } : { nome: "", banco: "", agencia: "", numero_conta: "", tipo: "corrente", saldo_inicial: 0, observacoes: "" });
  }, [open, conta, reset]);

  async function onSubmit(values: F) {
    const p = { nome: values.nome, banco: values.banco || null, agencia: values.agencia || null, numero_conta: values.numero_conta || null, tipo: values.tipo, saldo_inicial: values.saldo_inicial, observacoes: values.observacoes || null };
    try {
      conta ? await atualizar.mutateAsync({ id: conta.id, data: p }) : await criar.mutateAsync(p);
      onOpenChange(false);
    } catch {}
  }

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{conta ? "Editar conta" : "Nova conta bancária"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da conta *</Label>
            <Input id="nome" {...register("nome")} placeholder="Ex.: Bradesco Principal" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select id="tipo" {...register("tipo")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {TIPO_CONTA.map((t) => <option key={t} value={t}>{TIPO_CONTA_LABEL[t]}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saldo_inicial">Saldo inicial (R$)</Label>
              <Input id="saldo_inicial" type="number" step="0.01" {...register("saldo_inicial")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="banco">Banco</Label>
              <Input id="banco" {...register("banco")} placeholder="Itaú" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencia">Agência</Label>
              <Input id="agencia" {...register("agencia")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_conta">Conta</Label>
              <Input id="numero_conta" {...register("numero_conta")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register("observacoes")} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : conta ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
