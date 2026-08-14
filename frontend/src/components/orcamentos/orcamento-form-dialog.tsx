"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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
} from "@/components/ui/dialog";
import { useClientes } from "@/hooks/use-clientes";
import { useObras } from "@/hooks/use-obras";
import { useCriarOrcamento, useAtualizarOrcamento, useOrcamento } from "@/hooks/use-orcamentos";
import { formatMoeda, getLocalISODate } from "@/lib/format";
import { listarEstoque } from "@/lib/api/estoque";
import { extractErrorMessage } from "@/lib/api/client";
import type { Orcamento, OrcamentoItemInput, ItemEstoque } from "@/types";

interface ItemRow extends OrcamentoItemInput {
  _key: string; // chave de renderização local (não vai pro backend)
}

function emptyItem(): ItemRow {
  return {
    _key: crypto.randomUUID(),
    descricao: "",
    quantidade: "" as any,
    valor_unitario: "" as any,
    unidade: null,
    estoque_id: null,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamentoId?: string | null;
  clienteIdInicial?: string | null;
  onCriado?: (orcamentoId: string) => void;
}

export function OrcamentoFormDialog({ open, onOpenChange, orcamentoId, clienteIdInicial, onCriado }: Props) {
  const isEditing = Boolean(orcamentoId);
  const { data: orcamento } = useOrcamento(orcamentoId ?? null);

  const criar = useCriarOrcamento();
  const atualizar = useAtualizarOrcamento();

  const { data: clientesData } = useClientes({ search: "", page: 1, pageSize: 100 });
  const { data: obrasData } = useObras({ search: "", status: "todos", page: 1, pageSize: 100 });

  const [clienteId, setClienteId] = useState("");
  const [obraId, setObraId] = useState("");
  const [validade, setValidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [condicoesPagamento, setCondicoesPagamento] = useState("");
  const [itens, setItens] = useState<ItemRow[]>([emptyItem()]);

  const [estoqueItems, setEstoqueItems] = useState<ItemEstoque[]>([]);

  // Carregar itens do estoque para o dropdown
  useEffect(() => {
    if (open) {
      listarEstoque({ page: 1, pageSize: 100 }).then((res) => {
        setEstoqueItems(res.items);
      }).catch(() => {});
    }
  }, [open]);

  // Preencher dados ao editar
  useEffect(() => {
    if (open && isEditing && orcamento) {
      setClienteId(orcamento.cliente_id);
      setObraId(orcamento.obra_id ?? "");
      setValidade(orcamento.validade ?? "");
      setObservacoes(orcamento.observacoes ?? "");
      setCondicoesPagamento(orcamento.condicoes_pagamento ?? "");
      setItens(
        orcamento.itens.map((i) => ({
          _key: crypto.randomUUID(),
          descricao: i.descricao,
          quantidade: i.quantidade,
          valor_unitario: i.valor_unitario,
          unidade: i.unidade ?? null,
          estoque_id: i.estoque_id ?? null,
        }))
      );
    } else if (open && !isEditing) {
      setClienteId(clienteIdInicial ?? "");
      setObraId("");
      setValidade("");
      setObservacoes("");
      setCondicoesPagamento("");
      setItens([emptyItem()]);
    }
  }, [open, isEditing, orcamento, clienteIdInicial]);

  // Injetar opção atual do orçamento (padrão dropdown seguro da V1)
  const clientes = useMemo(() => {
    const list = clientesData?.items ?? [];
    if (isEditing && orcamento && !list.find((c) => c.id === orcamento.cliente_id)) {
      return [{ id: orcamento.cliente_id, nome: "(cliente atual)" } as any, ...list];
    }
    return list;
  }, [clientesData, isEditing, orcamento]);

  const obras = useMemo(() => {
    const list = obrasData?.items ?? [];
    if (isEditing && orcamento?.obra_id && !list.find((o) => o.id === orcamento.obra_id)) {
      return [{ id: orcamento.obra_id, nome: "(obra atual)" } as any, ...list];
    }
    return list;
  }, [obrasData, isEditing, orcamento]);

  function updateItem(index: number, field: keyof OrcamentoItemInput, value: any) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItens((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItens((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleEstoqueSelect(index: number, estoqueId: string) {
    if (!estoqueId) {
      updateItem(index, "estoque_id", null);
      return;
    }
    const estoque = estoqueItems.find((e) => e.id === estoqueId);
    if (estoque) {
      setItens((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                estoque_id: estoqueId,
                descricao: estoque.produto,
                valor_unitario: estoque.valor_medio,
                unidade: estoque.unidade ?? null,
              }
            : item
        )
      );
    }
  }

  const valorTotal = itens.reduce((sum, i) => sum + i.quantidade * i.valor_unitario, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      cliente_id: clienteId,
      obra_id: obraId || null,
      validade: validade || null,
      observacoes: observacoes || null,
      condicoes_pagamento: condicoesPagamento || null,
      itens: itens.map(({ _key, ...rest }) => rest),
    };

    try {
      if (isEditing && orcamentoId) {
        await atualizar.mutateAsync({ id: orcamentoId, data: payload });
      } else {
        const novo = await criar.mutateAsync(payload);
        onCriado?.(novo.id);
      }
      onOpenChange(false);
    } catch {
      // Erro já exibido via toast pelo onError dos hooks.
    }
  }

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente + Obra */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obra">Obra (opcional)</Label>
              <select
                id="obra"
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Nenhuma</option>
                {obras.map((o) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Validade */}
          <div className="space-y-2">
            <Label htmlFor="validade">Validade do orçamento</Label>
            <Input
              id="validade"
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
            />
          </div>

          {/* Itens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Itens *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Adicionar item
              </Button>
            </div>

            {itens.map((item, index) => (
              <div
                key={item._key}
                className="space-y-3 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground">Produto do estoque (opcional)</Label>
                    <select
                      value={item.estoque_id ?? ""}
                      onChange={(e) => handleEstoqueSelect(index, e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="">Texto livre</option>
                      {estoqueItems.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.produto} ({e.quantidade} {e.unidade ?? "un"})
                        </option>
                      ))}
                    </select>
                  </div>
                  {itens.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 shrink-0 text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Descrição *</Label>
                    <Input
                      value={item.descricao}
                      onChange={(e) => updateItem(index, "descricao", e.target.value)}
                      placeholder="Ex.: Cimento 50kg"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Qtd *</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, "quantidade", Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor unitário *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.valor_unitario}
                      onChange={(e) => updateItem(index, "valor_unitario", Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  Subtotal: {formatMoeda(item.quantidade * item.valor_unitario)}
                </div>
              </div>
            ))}

            <div className="text-right text-base font-semibold">
              Total: {formatMoeda(valorTotal)}
            </div>
          </div>

          {/* Condições de pagamento */}
          <div className="space-y-2">
            <Label htmlFor="condicoes_pagamento">Condições de pagamento</Label>
            <Textarea
              id="condicoes_pagamento"
              value={condicoesPagamento}
              onChange={(e) => setCondicoesPagamento(e.target.value)}
              placeholder="Ex: 30% de entrada, restante em 3x sem juros"
              rows={2}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar orçamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
