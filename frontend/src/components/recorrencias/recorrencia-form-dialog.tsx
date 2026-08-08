"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useCriarRecorrencia, useAtualizarRecorrencia } from "@/hooks/use-recorrencias";
import { listarClientes } from "@/lib/api/clientes";
import { TIPO_RECORRENCIA, TIPO_RECORRENCIA_LABEL } from "@/types";
import type { RecorrenciaFinanceira } from "@/types";

const schema = z.object({
  tipo: z.enum(TIPO_RECORRENCIA),
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.coerce.number().gt(0, "Valor deve ser maior que zero"),
  dia_vencimento: z.coerce.number().int().min(1).max(28),
  fornecedor: z.string().optional(),
  cliente_id: z.string().optional(),
  categoria: z.string().optional(),
  observacoes: z.string().optional(),
  gerar_mes_atual: z.boolean(),
  ativo: z.boolean(),
});
type F = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recorrencia?: RecorrenciaFinanceira | null;
}

export function RecorrenciaFormDialog({ open, onOpenChange, recorrencia }: Props) {
  const isEditing = Boolean(recorrencia);
  const criar = useCriarRecorrencia();
  const atualizar = useAtualizarRecorrencia();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset(recorrencia ? {
        tipo: recorrencia.tipo, descricao: recorrencia.descricao,
        valor: recorrencia.valor, dia_vencimento: recorrencia.dia_vencimento,
        fornecedor: recorrencia.fornecedor ?? "", cliente_id: recorrencia.cliente_id ?? "",
        categoria: recorrencia.categoria ?? "", observacoes: recorrencia.observacoes ?? "",
        gerar_mes_atual: false, ativo: recorrencia.ativo,
      } : {
        tipo: "pagar", descricao: "", valor: undefined as any, dia_vencimento: 10,
        fornecedor: "", cliente_id: "", categoria: "", observacoes: "",
        gerar_mes_atual: true, ativo: true,
      });
    }
  }, [open, recorrencia, reset]);

  const tipo = watch("tipo");

  async function buscarClientes(term: string) {
    const res = await listarClientes({ search: term, page: 1, pageSize: 20 });
    return res.items.map((c) => ({ id: c.id, label: c.nome }));
  }

  async function onSubmit(values: F) {
    try {
      if (isEditing && recorrencia) {
        await atualizar.mutateAsync({
          id: recorrencia.id,
          data: {
            descricao: values.descricao, valor: values.valor,
            dia_vencimento: values.dia_vencimento, ativo: values.ativo,
            fornecedor: values.fornecedor || null, cliente_id: values.cliente_id || null,
            categoria: values.categoria || null, observacoes: values.observacoes || null,
          },
        });
      } else {
        await criar.mutateAsync({
          tipo: values.tipo, descricao: values.descricao, valor: values.valor,
          dia_vencimento: values.dia_vencimento,
          fornecedor: values.fornecedor || null, cliente_id: values.cliente_id || null,
          categoria: values.categoria || null, observacoes: values.observacoes || null,
          gerar_mes_atual: values.gerar_mes_atual,
        });
      }
      onOpenChange(false);
    } catch {}
  }

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEditing ? "Editar Recorrência" : "Nova Recorrência"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select {...register("tipo")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {TIPO_RECORRENCIA.map((t) => <option key={t} value={t}>{TIPO_RECORRENCIA_LABEL[t]}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" {...register("descricao")} placeholder="Ex.: Aluguel do escritório" />
            {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input id="valor" type="number" step="0.01" {...register("valor")} />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dia_vencimento">Dia do vencimento</Label>
              <Input id="dia_vencimento" type="number" min={1} max={28} {...register("dia_vencimento")} />
            </div>
          </div>
          {tipo === "pagar" ? (
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input id="fornecedor" {...register("fornecedor")} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <SearchableSelect
                value={watch("cliente_id") ?? ""}
                onChange={(id) => setValue("cliente_id", id)}
                onSearch={buscarClientes}
                placeholder="Buscar cliente..."
                currentLabel=""
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input id="categoria" {...register("categoria")} placeholder="Ex.: Despesas fixas" />
          </div>
          {!isEditing && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("gerar_mes_atual")} className="h-4 w-4" />
              Gerar conta do mês atual imediatamente
            </label>
          )}
          {isEditing && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("ativo")} className="h-4 w-4" />
              Recorrência ativa
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
