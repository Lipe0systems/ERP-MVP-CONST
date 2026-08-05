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
import { useClientes } from "@/hooks/use-clientes";
import { useObras } from "@/hooks/use-obras";
import { useAtualizarContaReceber, useCriarContaReceber } from "@/hooks/use-financeiro";
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

  // Só busca clientes/obras com o modal aberto (lição da revisão da Fase 3).
  const { data: clientesData, isLoading: loadingClientes } = useClientes({
    search: "",
    page: 1,
    pageSize: 100,
    enabled: open,
  });
  const { data: obrasData, isLoading: loadingObras } = useObras({
    search: "",
    status: "todos",
    page: 1,
    pageSize: 100,
    enabled: open,
  });

  // Se a conta em edição tiver cliente/obra fora da primeira página de 100
  // (base grande), eles ainda aparecem como opção — evita que o <select>
  // caia silenciosamente em "Nenhum(a)" e desvincule o registro ao salvar
  // sem querer (mesmo bug identificado e corrigido em ObraFormDialog na
  // Fase 3, aqui com um agravante: a perda do vínculo seria silenciosa).
  const opcoesClientes = useMemo((): { id: string; nome: string }[] => {
    const lista = clientesData?.items ?? [];
    if (conta?.cliente_id && conta.cliente_nome && !lista.some((c) => c.id === conta.cliente_id)) {
      return [{ id: conta.cliente_id, nome: conta.cliente_nome }, ...lista];
    }
    return lista;
  }, [clientesData, conta]);

  const opcoesObras = useMemo((): { id: string; nome: string }[] => {
    const lista = obrasData?.items ?? [];
    if (conta?.obra_id && conta.obra_nome && !lista.some((o) => o.id === conta.obra_id)) {
      return [{ id: conta.obra_id, nome: conta.obra_nome }, ...lista];
    }
    return lista;
  }, [obrasData, conta]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
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
              <Label htmlFor="cliente_id">Cliente</Label>
              <Select id="cliente_id" disabled={loadingClientes} {...register("cliente_id")}>
                <option value="">{loadingClientes ? "Carregando..." : "Nenhum"}</option>
                {opcoesClientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
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
