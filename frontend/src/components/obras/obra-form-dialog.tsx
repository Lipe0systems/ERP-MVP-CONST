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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { listarClientes } from "@/lib/api/clientes";
import { useAtualizarObra, useCriarObra } from "@/hooks/use-obras";
import { OBRA_STATUS, OBRA_STATUS_LABEL } from "@/types";
import type { ObraListItem } from "@/types";

const obraSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome da obra."),
    cliente_id: z.string().min(1, "Selecione um cliente."),
    endereco: z.string().trim().optional().or(z.literal("")),
    responsavel: z.string().trim().optional().or(z.literal("")),
    data_inicio: z.string().optional().or(z.literal("")),
    data_previsao: z.string().optional().or(z.literal("")),
    status: z.enum(OBRA_STATUS),
    valor_previsto: z.string().optional().or(z.literal("")),
    valor_realizado: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => !data.data_inicio || !data.data_previsao || data.data_previsao >= data.data_inicio,
    { message: "A previsão não pode ser anterior ao início.", path: ["data_previsao"] }
  );

type ObraFormValues = z.infer<typeof obraSchema>;

const DEFAULT_VALUES: ObraFormValues = {
  nome: "",
  cliente_id: "",
  endereco: "",
  responsavel: "",
  data_inicio: "",
  data_previsao: "",
  status: "planejamento",
  valor_previsto: "",
  valor_realizado: "",
};

interface ObraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra?: ObraListItem | null;
}

export function ObraFormDialog({ open, onOpenChange, obra }: ObraFormDialogProps) {
  const isEditing = Boolean(obra);
  const criar = useCriarObra();
  const atualizar = useAtualizarObra();
  const loading = criar.isPending || atualizar.isPending;

  // page_size alto o suficiente para a maioria dos cadastros iniciais; para
  // Busca de clientes com autocomplete: sempre retorna resultados
  // relevantes independente do tamanho da base, substituindo o antigo
  // select com pageSize=100.
  async function buscarClientes(term: string) {
    const res = await listarClientes({ search: term, page: 1, pageSize: 20 });
    return res.items.map((c) => ({ id: c.id, label: c.nome }));
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ObraFormValues>({
    resolver: zodResolver(obraSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      obra
        ? {
            nome: obra.nome,
            cliente_id: obra.cliente_id,
            endereco: obra.endereco ?? "",
            responsavel: obra.responsavel ?? "",
            data_inicio: obra.data_inicio ?? "",
            data_previsao: obra.data_previsao ?? "",
            status: obra.status,
            valor_previsto: obra.valor_previsto != null ? String(obra.valor_previsto) : "",
            valor_realizado: obra.valor_realizado != null ? String(obra.valor_realizado) : "",
          }
        : DEFAULT_VALUES
    );
  }, [open, obra, reset]);

  async function onSubmit(values: ObraFormValues) {
    const payload = {
      nome: values.nome,
      cliente_id: values.cliente_id,
      endereco: values.endereco || null,
      responsavel: values.responsavel || null,
      data_inicio: values.data_inicio || null,
      data_previsao: values.data_previsao || null,
      status: values.status,
      valor_previsto: values.valor_previsto ? Number(values.valor_previsto) : null,
      valor_realizado: values.valor_realizado ? Number(values.valor_realizado) : null,
    };

    try {
      if (isEditing && obra) {
        await atualizar.mutateAsync({ id: obra.id, data: payload });
      } else {
        await criar.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // Erro já exibido via toast pelo onError dos hooks de mutação; mantemos
      // o modal aberto para o usuário corrigir e tentar novamente.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar obra" : "Nova instalação"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados da obra." : "Preencha os dados para cadastrar uma nova obra."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome da obra *</Label>
              <Input
                id="nome"
                aria-invalid={Boolean(errors.nome)}
                aria-describedby={errors.nome ? "nome-error" : undefined}
                {...register("nome")}
              />
              {errors.nome && (
                <p id="nome-error" className="text-xs text-destructive">
                  {errors.nome.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cliente *</Label>
              <SearchableSelect
                value={watch("cliente_id")}
                onChange={(id) => setValue("cliente_id", id, { shouldValidate: true })}
                onSearch={buscarClientes}
                placeholder="Buscar cliente..."
                currentLabel={obra?.cliente_nome ?? ""}
              />
              {errors.cliente_id && (
                <p className="text-xs text-destructive">{errors.cliente_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register("status")}>
                {OBRA_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {OBRA_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input id="responsavel" {...register("responsavel")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" {...register("endereco")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de início</Label>
              <Input id="data_inicio" type="date" {...register("data_inicio")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_previsao">Previsão de término</Label>
              <Input
                id="data_previsao"
                type="date"
                aria-invalid={Boolean(errors.data_previsao)}
                aria-describedby={errors.data_previsao ? "data-previsao-error" : undefined}
                {...register("data_previsao")}
              />
              {errors.data_previsao && (
                <p id="data-previsao-error" className="text-xs text-destructive">
                  {errors.data_previsao.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_previsto">Valor previsto (R$)</Label>
              <Input id="valor_previsto" type="number" step="0.01" min="0" {...register("valor_previsto")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_realizado">Valor realizado (R$)</Label>
              <Input id="valor_realizado" type="number" step="0.01" min="0" {...register("valor_realizado")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar alterações" : "Cadastrar obra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
