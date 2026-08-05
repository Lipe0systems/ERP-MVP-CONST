"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAtualizarItemEstoque, useCriarItemEstoque } from "@/hooks/use-estoque";
import { formatMoeda } from "@/lib/format";
import type { ItemEstoque } from "@/types";

const estoqueSchema = z.object({
  produto: z.string().trim().min(2, "Informe o produto."),
  quantidade: z.string().min(1, "Informe a quantidade.").refine((v) => Number(v) >= 0, "Não pode ser negativo."),
  unidade: z.string().trim().optional().or(z.literal("")),
  valor_medio: z
    .string()
    .min(1, "Informe o valor médio.")
    .refine((v) => Number(v) >= 0, "Não pode ser negativo."),
  observacoes: z.string().trim().optional().or(z.literal("")),
});

type EstoqueFormValues = z.infer<typeof estoqueSchema>;

const DEFAULT_VALUES: EstoqueFormValues = {
  produto: "",
  quantidade: "",
  unidade: "",
  valor_medio: "",
  observacoes: "",
};

interface EstoqueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemEstoque | null;
}

export function EstoqueFormDialog({ open, onOpenChange, item }: EstoqueFormDialogProps) {
  const isEditing = Boolean(item);
  const criar = useCriarItemEstoque();
  const atualizar = useAtualizarItemEstoque();
  const loading = criar.isPending || atualizar.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EstoqueFormValues>({
    resolver: zodResolver(estoqueSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const quantidade = watch("quantidade");
  const valorMedio = watch("valor_medio");
  const valorTotal = (Number(quantidade) || 0) * (Number(valorMedio) || 0);

  useEffect(() => {
    if (!open) return;
    reset(
      item
        ? {
            produto: item.produto,
            quantidade: String(item.quantidade),
            unidade: item.unidade ?? "",
            valor_medio: String(item.valor_medio),
            observacoes: item.observacoes ?? "",
          }
        : DEFAULT_VALUES
    );
  }, [open, item, reset]);

  async function onSubmit(values: EstoqueFormValues) {
    const payload = {
      produto: values.produto,
      quantidade: Number(values.quantidade),
      unidade: values.unidade || null,
      valor_medio: Number(values.valor_medio),
      observacoes: values.observacoes || null,
    };

    try {
      if (isEditing && item) {
        await atualizar.mutateAsync({ id: item.id, data: payload });
      } else {
        await criar.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // Erro já exibido via toast pelo onError dos hooks de mutação.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar item de estoque" : "Novo item de estoque"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do item." : "Preencha os dados do novo item de estoque."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="produto">Produto *</Label>
              <Input id="produto" aria-invalid={Boolean(errors.produto)} {...register("produto")} />
              {errors.produto && <p className="text-xs text-destructive">{errors.produto.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.001"
                min="0"
                aria-invalid={Boolean(errors.quantidade)}
                {...register("quantidade")}
              />
              {errors.quantidade && <p className="text-xs text-destructive">{errors.quantidade.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input id="unidade" placeholder="un, kg, m³, saco..." maxLength={20} {...register("unidade")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_medio">Valor médio (R$) *</Label>
              <Input
                id="valor_medio"
                type="number"
                step="0.01"
                min="0"
                aria-invalid={Boolean(errors.valor_medio)}
                {...register("valor_medio")}
              />
              {errors.valor_medio && <p className="text-xs text-destructive">{errors.valor_medio.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Valor total em estoque</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                {formatMoeda(valorTotal)}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" rows={3} {...register("observacoes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar alterações" : "Cadastrar item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
