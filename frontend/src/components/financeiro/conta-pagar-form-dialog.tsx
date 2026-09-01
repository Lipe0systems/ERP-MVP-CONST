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
import { useFornecedoresDropdown } from "@/hooks/use-fornecedores";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { listarObras } from "@/lib/api/obras";
import { useAtualizarContaPagar, useCriarContaPagar } from "@/hooks/use-financeiro";
import { STATUS_CONTA, type ContaPagarListItem } from "@/types";

const STATUS_LABEL: Record<(typeof STATUS_CONTA)[number], string> = {
  pendente: "Pendente",
  liquidado: "Pago",
  cancelado: "Cancelado",
};

const contaPagarSchema = z
  .object({
    descricao: z.string().trim().min(2, "Informe a descrição."),
    valor: z.string().min(1, "Informe o valor.").refine((v) => Number(v) > 0, "Valor deve ser maior que zero."),
    data_vencimento: z.string().min(1, "Informe a data de vencimento."),
    fornecedor: z.string().trim().optional().or(z.literal("")),
    obra_id: z.string().optional().or(z.literal("")),
    categoria: z.string().trim().optional().or(z.literal("")),
    data_pagamento: z.string().optional().or(z.literal("")),
    status: z.enum(STATUS_CONTA),
    observacoes: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.status !== "liquidado" || data.data_pagamento, {
    message: "Informe a data de pagamento para marcar como paga.",
    path: ["data_pagamento"],
  });

type ContaPagarFormValues = z.infer<typeof contaPagarSchema>;

const DEFAULT_VALUES: ContaPagarFormValues = {
  descricao: "",
  valor: "",
  data_vencimento: "",
  fornecedor: "",
  obra_id: "",
  categoria: "",
  data_pagamento: "",
  status: "pendente",
  observacoes: "",
};

interface ContaPagarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaPagarListItem | null;
}

export function ContaPagarFormDialog({ open, onOpenChange, conta }: ContaPagarFormDialogProps) {
  const isEditing = Boolean(conta);
  const criar = useCriarContaPagar();
  const atualizar = useAtualizarContaPagar();
  const loading = criar.isPending || atualizar.isPending;

  // Só busca obras com o modal aberto — evita 1 chamada de API extra toda
  // vez que a tela de Financeiro é carregada (lição da revisão da Fase 3).
  const { data: fornecedoresData } = useFornecedoresDropdown();
  const fornecedores = fornecedoresData?.items ?? [];

  async function buscarObras(term: string) {
    const res = await listarObras({ search: term, status: "todos", page: 1, pageSize: 20 });
    return res.items.map((o) => ({ id: o.id, label: o.nome }));
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContaPagarFormValues>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const status = watch("status");

  useEffect(() => {
    if (!open) return;
    reset(
      conta
        ? {
            descricao: conta.descricao,
            valor: String(conta.valor),
            data_vencimento: conta.data_vencimento,
            fornecedor: conta.fornecedor ?? "",
            obra_id: conta.obra_id ?? "",
            categoria: conta.categoria ?? "",
            data_pagamento: conta.data_pagamento ?? "",
            status: conta.status,
            observacoes: conta.observacoes ?? "",
          }
        : DEFAULT_VALUES
    );
  }, [open, conta, reset]);

  async function onSubmit(values: ContaPagarFormValues) {
    const payload = {
      descricao: values.descricao,
      valor: Number(values.valor),
      data_vencimento: values.data_vencimento,
      fornecedor: values.fornecedor || null,
      obra_id: values.obra_id || null,
      categoria: values.categoria || null,
      data_pagamento: values.data_pagamento || null,
      status: values.status,
      observacoes: values.observacoes || null,
    };

    try {
      if (isEditing && conta) {
        await atualizar.mutateAsync({ id: conta.id, data: payload });
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
          <DialogTitle>{isEditing ? "Editar conta a pagar" : "Nova conta a pagar"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do lançamento." : "Preencha os dados do novo lançamento."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                aria-invalid={Boolean(errors.descricao)}
                {...register("descricao")}
              />
              {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                aria-invalid={Boolean(errors.valor)}
                {...register("valor")}
              />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input
                id="fornecedor"
                list="fornecedores-pagar-list"
                placeholder="Digite ou selecione..."
                {...register("fornecedor")}
              />
              <datalist id="fornecedores-pagar-list">
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.nome} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" placeholder="Material, mão de obra..." {...register("categoria")} />
            </div>

            <div className="space-y-2">
              <Label>Instalação</Label>
              <SearchableSelect
                value={watch("obra_id") ?? ""}
                onChange={(id) => setValue("obra_id", id)}
                onSearch={buscarObras}
                placeholder="Buscar instalação..."
                currentLabel={conta?.obra_nome ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de vencimento *</Label>
              <Input
                id="data_vencimento"
                type="date"
                aria-invalid={Boolean(errors.data_vencimento)}
                {...register("data_vencimento")}
              />
              {errors.data_vencimento && (
                <p className="text-xs text-destructive">{errors.data_vencimento.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register("status")}>
                {STATUS_CONTA.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_pagamento">
                Data de pagamento {status === "liquidado" && "*"}
              </Label>
              <Input
                id="data_pagamento"
                type="date"
                aria-invalid={Boolean(errors.data_pagamento)}
                {...register("data_pagamento")}
              />
              {errors.data_pagamento && (
                <p className="text-xs text-destructive">{errors.data_pagamento.message}</p>
              )}
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
              {isEditing ? "Salvar alterações" : "Cadastrar conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
