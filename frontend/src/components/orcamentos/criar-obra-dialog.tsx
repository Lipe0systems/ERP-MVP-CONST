"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { HardHat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCriarObraDoOrcamento } from "@/hooks/use-orcamentos";
import { formatMoeda } from "@/lib/format";

const schema = z.object({
  nome: z.string().optional(),
  endereco: z.string().optional(),
  responsavel: z.string().optional(),
  data_inicio: z.string().optional(),
  data_previsao: z.string().optional(),
});
type F = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orcamentoId: string;
  orcamentoNumero: number;
  valorTotal: number;
  onCriado?: (obraId: string) => void;
}

export function CriarObraDialog({ open, onOpenChange, orcamentoId, orcamentoNumero, valorTotal, onCriado }: Props) {
  const criar = useCriarObraDoOrcamento();
  const { register, handleSubmit } = useForm<F>({ resolver: zodResolver(schema) });

  async function onSubmit(values: F) {
    try {
      const resp = await criar.mutateAsync({
        id: orcamentoId,
        dados: {
          nome: values.nome || undefined,
          endereco: values.endereco || undefined,
          responsavel: values.responsavel || undefined,
          data_inicio: values.data_inicio || undefined,
          data_previsao: values.data_previsao || undefined,
        },
      });
      onCriado?.(resp.obra_id);
      onOpenChange(false);
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-amber-600" />
            Criar obra a partir do orçamento #{orcamentoNumero}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          O cliente, o valor previsto ({formatMoeda(valorTotal)}) e o prazo serão reaproveitados
          automaticamente. Você pode ajustar os campos abaixo — todos são opcionais.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="nome">Nome da obra</Label>
            <Input id="nome" placeholder={`Obra — Orçamento #${orcamentoNumero}`} {...register("nome")} />
          </div>
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register("endereco")} />
          </div>
          <div>
            <Label htmlFor="responsavel">Responsável</Label>
            <Input id="responsavel" {...register("responsavel")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="data_inicio">Início previsto</Label>
              <Input id="data_inicio" type="date" {...register("data_inicio")} />
            </div>
            <div>
              <Label htmlFor="data_previsao">Prazo previsto</Label>
              <Input id="data_previsao" type="date" {...register("data_previsao")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending}>
              {criar.isPending ? "Criando..." : "Criar obra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
