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
import { useAtualizarContaReceber, useCriarContaReceber } from "@/hooks/use-financeiro";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { listarClientes } from "@/lib/api/clientes";
import { listarObras } from "@/lib/api/obras";
import { STATUS_CONTA, type ContaReceberListItem } from "@/types";

const STATUS_LABEL: Record<(typeof STATUS_CONTA)[number], string> = {
  pendente: "Pendente",
  liquidado: "Recebido",
  cancelado: "Cancelado",
};

const contaReceberSchema = z
  .object({
    descricao: z.string().trim().min(2, "Informe a descrição."),
    valor: z.string().min(1, "Informe o valor.").refine((v) => Number(v) > 0, "Valor deve ser maior que zero."),
    data_vencimento: z.string().min(1, "Informe a data de vencimento."),
    cliente_id: z.string().optional().or(z.literal("")),
    obra_id: z.string().optional().or(z.literal("")),
    data_recebimento: z.string().optional().or(z.literal("")),
    status: z.enum(STATUS_CONTA),
    observacoes: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.status !== "liquidado" || data.data_recebimento, {
    message: "Informe a data de recebimento para marcar como recebida.",
    path: ["data_recebimento"],
  });

type ContaReceberFormValues = z.infer<typeof contaReceberSchema>;

const DEFAULT_VALUES: ContaReceberFormValues = {
  descricao: "",
  valor: "",
  data_vencimento: "",
  cliente_id: "",
  obra_id: "",
  data_recebimento: "",
  status: "pendente",
  observacoes: "",
};

interface ContaReceberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaReceberListItem | null;
}

export function ContaReceberFormDialog({ open, onOpenChange, conta }: ContaReceberFormDialogProps) {
  const isEditing = Boolean(conta);
  const criar = useCriarContaReceber();
  const atualizar = useAtualizarContaReceber();
  const loading = criar.isPending || atualizar.isPending;

  async function buscarClientes(term: string) {
    const res = await listarClientes({ search: term, page: 1, pageSize: 20 });
    return res.items.map((c) => ({ id: c.id, label: c.nome }));
  }

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
  } = useForm<ContaReceberFormValues>({
    resolver: zodResolver(contaReceberSchema),
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
            cliente_id: conta.cliente_id ?? "",
            obra_id: conta.obra_id ?? "",
            data_recebimento: conta.data_recebimento ?? "",
            status: conta.status,
            observacoes: conta.observacoes ?? "",
          }
        : DEFAULT_VALUES
    );
  }, [open, conta, reset]);

  async function onSubmit(values: ContaReceberFormValues) {
    const payload = {
      descricao: values.descricao,
      valor: Number(values.valor),
      data_vencimento: values.data_vencimento,
      cliente_id: values.cliente_id || null,
      obra_id: values.obra_id || null,
      data_recebimento: values.data_recebimento || null,
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
          <DialogTitle>{isEditing ? "Editar conta a receber" : "Nova conta a receber"}</DialogTitle>
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
              <Label>Cliente</Label>
              <SearchableSelect
                value={watch("cliente_id") ?? ""}
                onChange={(id) => setValue("cliente_id", id)}
                onSearch={buscarClientes}
                placeholder="Buscar cliente..."
                currentLabel={conta?.cliente_nome ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Obra</Label>
              <SearchableSelect
                value={watch("obra_id") ?? ""}
                onChange={(id) => setValue("obra_id", id)}
                onSearch={buscarObras}
                placeholder="Buscar obra..."
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
              <Label htmlFor="data_recebimento">
                Data de recebimento {status === "liquidado" && "*"}
              </Label>
              <Input
                id="data_recebimento"
                type="date"
                aria-invalid={Boolean(errors.data_recebimento)}
                {...register("data_recebimento")}
              />
              {errors.data_recebimento && (
                <p className="text-xs text-destructive">{errors.data_recebimento.message}</p>
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
