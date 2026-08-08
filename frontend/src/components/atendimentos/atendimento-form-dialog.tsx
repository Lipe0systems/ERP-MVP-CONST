"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useCriarAtendimento, useAtualizarAtendimento } from "@/hooks/use-atendimentos";
import { listarClientes } from "@/lib/api/clientes";
import { listarObras } from "@/lib/api/obras";
import { getLocalISODate } from "@/lib/format";
import { TIPO_ATENDIMENTO, STATUS_ATENDIMENTO, TIPO_ATENDIMENTO_LABEL, STATUS_ATENDIMENTO_LABEL } from "@/types";
import type { AtendimentoListItem } from "@/types";

const schema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  obra_id: z.string().optional(),
  tipo: z.enum(TIPO_ATENDIMENTO),
  status: z.enum(STATUS_ATENDIMENTO),
  data: z.string().min(1, "Data obrigatória"),
  hora: z.string().optional(),
  responsavel: z.string().optional(),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
});

type F = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  atendimento?: AtendimentoListItem | null;
}

export function AtendimentoFormDialog({ open, onOpenChange, atendimento }: Props) {
  const isEditing = Boolean(atendimento);
  const criar = useCriarAtendimento();
  const atualizar = useAtualizarAtendimento();
  const [checklist, setChecklist] = useState<string[]>([]);
  const [novoItem, setNovoItem] = useState("");
  const [checklistOk, setChecklistOk] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      if (atendimento) {
        reset({
          cliente_id: atendimento.cliente_id, obra_id: atendimento.obra_id ?? "",
          tipo: atendimento.tipo, status: atendimento.status,
          data: atendimento.data, hora: atendimento.hora ?? "",
          responsavel: atendimento.responsavel ?? "",
          descricao: atendimento.descricao ?? "",
          observacoes: "",
        });
        setChecklist(atendimento.checklist);
        setChecklistOk(new Set(atendimento.checklist_ok));
      } else {
        reset({ cliente_id: "", obra_id: "", tipo: "visita", status: "agendado", data: getLocalISODate(), hora: "", responsavel: "", descricao: "", observacoes: "" });
        setChecklist([]); setChecklistOk(new Set());
      }
    }
  }, [open, atendimento, reset]);

  async function buscarClientes(term: string) {
    const res = await listarClientes({ search: term, page: 1, pageSize: 20 });
    return res.items.map((c) => ({ id: c.id, label: c.nome }));
  }

  async function buscarObras(term: string) {
    const res = await listarObras({ search: term, status: "todos", page: 1, pageSize: 20 });
    return res.items.map((o) => ({ id: o.id, label: o.nome }));
  }

  function addChecklist() {
    if (!novoItem.trim()) return;
    setChecklist((prev) => [...prev, novoItem.trim()]);
    setNovoItem("");
  }

  function removeChecklist(item: string) {
    setChecklist((prev) => prev.filter((i) => i !== item));
    setChecklistOk((prev) => { const s = new Set(prev); s.delete(item); return s; });
  }

  function toggleOk(item: string) {
    setChecklistOk((prev) => {
      const s = new Set(prev);
      s.has(item) ? s.delete(item) : s.add(item);
      return s;
    });
  }

  async function onSubmit(values: F) {
    const payload = {
      cliente_id: values.cliente_id,
      obra_id: values.obra_id || null,
      tipo: values.tipo, status: values.status,
      data: values.data, hora: values.hora || null,
      responsavel: values.responsavel || null,
      descricao: values.descricao || null,
      checklist, checklist_ok: Array.from(checklistOk),
      fotos: atendimento?.fotos ?? [],
      assinatura_url: null,
      observacoes: values.observacoes || null,
    };
    try {
      isEditing && atendimento
        ? await atualizar.mutateAsync({ id: atendimento.id, data: payload })
        : await criar.mutateAsync(payload);
      onOpenChange(false);
    } catch {}
  }

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Atendimento" : "Novo Atendimento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Cliente + Obra */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <SearchableSelect
                value={watch("cliente_id")}
                onChange={(id) => setValue("cliente_id", id, { shouldValidate: true })}
                onSearch={buscarClientes}
                placeholder="Buscar cliente..."
                currentLabel={atendimento?.cliente_nome ?? ""}
              />
              {errors.cliente_id && <p className="text-xs text-destructive">{errors.cliente_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Obra (opcional)</Label>
              <SearchableSelect
                value={watch("obra_id") ?? ""}
                onChange={(id) => setValue("obra_id", id)}
                onSearch={buscarObras}
                placeholder="Buscar obra..."
                currentLabel={atendimento?.obra_nome ?? ""}
              />
            </div>
          </div>

          {/* Tipo + Status + Data + Hora */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select {...register("tipo")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {TIPO_ATENDIMENTO.map((t) => <option key={t} value={t}>{TIPO_ATENDIMENTO_LABEL[t]}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select {...register("status")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {STATUS_ATENDIMENTO.map((s) => <option key={s} value={s}>{STATUS_ATENDIMENTO_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input id="data" type="date" {...register("data")} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input id="hora" type="time" {...register("hora")} />
            </div>
          </div>

          {/* Responsável + Descrição */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input id="responsavel" {...register("responsavel")} placeholder="Nome do responsável pelo atendimento" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register("descricao")} rows={3} placeholder="Descreva o atendimento..." />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <Label>Checklist</Label>
            <div className="flex gap-2">
              <Input value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Adicionar item ao checklist" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChecklist())} />
              <Button type="button" variant="outline" size="sm" onClick={addChecklist}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {checklist.length > 0 && (
              <div className="space-y-1.5 rounded-md border p-3">
                {checklist.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <input type="checkbox" checked={checklistOk.has(item)} onChange={() => toggleOk(item)} className="h-4 w-4 accent-green-600" />
                    <span className={`flex-1 text-sm ${checklistOk.has(item) ? "line-through text-muted-foreground" : ""}`}>{item}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeChecklist(item)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register("observacoes")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : isEditing ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
