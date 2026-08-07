"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useObras } from "@/hooks/use-obras";
import { useFornecedoresDropdown } from "@/hooks/use-fornecedores";
import { useAtualizarCompra, useCriarCompra } from "@/hooks/use-compras";
import { STATUS_COMPRA, type CompraListItem } from "@/types";
import { formatMoeda, getLocalISODate } from "@/lib/format";

const STATUS_LABEL: Record<(typeof STATUS_COMPRA)[number], string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  recebida: "Recebida",
  cancelada: "Cancelada",
};

const compraSchema = z.object({
  fornecedor: z.string().trim().min(2, "Informe o fornecedor."),
  produto: z.string().trim().min(2, "Informe o produto."),
  quantidade: z.string().min(1, "Informe a quantidade.").refine((v) => Number(v) > 0, "Deve ser maior que zero."),
  unidade: z.string().trim().optional().or(z.literal("")),
  valor_unitario: z
    .string()
    .min(1, "Informe o valor unitário.")
    .refine((v) => Number(v) > 0, "Deve ser maior que zero."),
  data_compra: z.string().min(1, "Informe a data da compra."),
  obra_id: z.string().optional().or(z.literal("")),
  status: z.enum(STATUS_COMPRA),
  observacoes: z.string().trim().optional().or(z.literal("")),
});

type CompraFormValues = z.infer<typeof compraSchema>;

const DEFAULT_VALUES: CompraFormValues = {
  fornecedor: "",
  produto: "",
  quantidade: "",
  unidade: "",
  valor_unitario: "",
  data_compra: "",
  obra_id: "",
  status: "pendente",
  observacoes: "",
};

interface CompraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compra?: CompraListItem | null;
}

export function CompraFormDialog({ open, onOpenChange, compra }: CompraFormDialogProps) {
  const isEditing = Boolean(compra);
  const criar = useCriarCompra();
  const atualizar = useAtualizarCompra();
  const loading = criar.isPending || atualizar.isPending;

  // Só busca obras com o modal aberto — evita 1 chamada de API extra toda
  // vez que a tela de Compras é carregada (lição da revisão da Fase 3).
  const { data: fornecedoresData } = useFornecedoresDropdown();
  const fornecedores = fornecedoresData?.items ?? [];

  const { data: obrasData, isLoading: loadingObras } = useObras({
    search: "",
    status: "todos",
    page: 1,
    pageSize: 100,
    enabled: open,
  });

  // Se a compra em edição tiver uma obra fora da primeira página de 100
  // (base grande), ela ainda aparece como opção — evita que o <select> caia
  // silenciosamente em "Nenhuma" e desvincule a obra ao salvar sem querer
  // (bug identificado e corrigido nos formulários de Financeiro na Fase 4).
  const opcoesObras = useMemo((): { id: string; nome: string }[] => {
    const lista = obrasData?.items ?? [];
    if (compra?.obra_id && compra.obra_nome && !lista.some((o) => o.id === compra.obra_id)) {
      return [{ id: compra.obra_id, nome: compra.obra_nome }, ...lista];
    }
    return lista;
  }, [obrasData, compra]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const quantidade = watch("quantidade");
  const valorUnitario = watch("valor_unitario");
  const valorTotal = (Number(quantidade) || 0) * (Number(valorUnitario) || 0);

  useEffect(() => {
    if (!open) return;
    reset(
      compra
        ? {
            fornecedor: compra.fornecedor,
            produto: compra.produto,
            quantidade: String(compra.quantidade),
            unidade: compra.unidade ?? "",
            valor_unitario: String(compra.valor_unitario),
            data_compra: compra.data_compra,
            obra_id: compra.obra_id ?? "",
            status: compra.status,
            observacoes: compra.observacoes ?? "",
          }
        : { ...DEFAULT_VALUES, data_compra: getLocalISODate() }
    );
  }, [open, compra, reset]);

  async function onSubmit(values: CompraFormValues) {
    const payload = {
      fornecedor: values.fornecedor,
      produto: values.produto,
      quantidade: Number(values.quantidade),
      unidade: values.unidade || null,
      valor_unitario: Number(values.valor_unitario),
      data_compra: values.data_compra,
      obra_id: values.obra_id || null,
      status: values.status,
      observacoes: values.observacoes || null,
    };

    try {
      if (isEditing && compra) {
        await atualizar.mutateAsync({ id: compra.id, data: payload });
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar compra" : "Nova compra"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados da compra." : "Preencha os dados da nova compra."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="produto">Produto *</Label>
              <Input id="produto" aria-invalid={Boolean(errors.produto)} {...register("produto")} />
              {errors.produto && <p className="text-xs text-destructive">{errors.produto.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Input
                id="fornecedor"
                list="fornecedores-list"
                placeholder="Digite ou selecione..."
                aria-invalid={Boolean(errors.fornecedor)}
                {...register("fornecedor")}
              />
              <datalist id="fornecedores-list">
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.nome} />
                ))}
              </datalist>
              {errors.fornecedor && <p className="text-xs text-destructive">{errors.fornecedor.message}</p>}
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
              <Input id="unidade" placeholder="un, kg, m³, saco..." {...register("unidade")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_unitario">Valor unitário (R$) *</Label>
              <Input
                id="valor_unitario"
                type="number"
                step="0.01"
                min="0"
                aria-invalid={Boolean(errors.valor_unitario)}
                {...register("valor_unitario")}
              />
              {errors.valor_unitario && (
                <p className="text-xs text-destructive">{errors.valor_unitario.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Valor total</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                {formatMoeda(valorTotal)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_compra">Data da compra *</Label>
              <Input
                id="data_compra"
                type="date"
                aria-invalid={Boolean(errors.data_compra)}
                {...register("data_compra")}
              />
              {errors.data_compra && <p className="text-xs text-destructive">{errors.data_compra.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register("status")}>
                {STATUS_COMPRA.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="obra_id">Obra</Label>
              <Select id="obra_id" disabled={loadingObras} {...register("obra_id")}>
                <option value="">{loadingObras ? "Carregando..." : "Nenhuma"}</option>
                {opcoesObras.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </Select>
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
              {isEditing ? "Salvar alterações" : "Cadastrar compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
