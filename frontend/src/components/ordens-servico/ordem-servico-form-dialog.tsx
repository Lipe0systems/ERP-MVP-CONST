"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClientes } from "@/hooks/use-clientes";
import { useObras } from "@/hooks/use-obras";
import { useCriarOrdemServico, useAtualizarOrdemServico } from "@/hooks/use-ordens-servico";
import { listarUsuarios } from "@/lib/api/usuarios";
import type { OrdemServico } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordem?: OrdemServico | null;
}

export function OrdemServicoFormDialog({ open, onOpenChange, ordem }: Props) {
  const isEditing = !!ordem;

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [obraId, setObraId] = useState("");
  const [instaladorId, setInstaladorId] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataAgendada, setDataAgendada] = useState("");

  const { data: clientesData } = useClientes({ search: "", page: 1, pageSize: 100, enabled: open });
  const { data: obrasData } = useObras({ search: "", status: "todos", page: 1, pageSize: 100, enabled: open });
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios-para-os"],
    queryFn: listarUsuarios,
    enabled: open,
  });

  const instaladores = useMemo(
    () => (usuarios ?? []).filter((u) => u.papel === "instalador"),
    [usuarios]
  );

  const criar = useCriarOrdemServico();
  const atualizar = useAtualizarOrdemServico(ordem?.id ?? "");
  const salvando = criar.isPending || atualizar.isPending;

  useEffect(() => {
    if (open && ordem) {
      setTitulo(ordem.titulo);
      setDescricao(ordem.descricao ?? "");
      setClienteId(ordem.cliente_id ?? "");
      setObraId(ordem.obra_id ?? "");
      setInstaladorId(ordem.instalador_id ?? "");
      setEndereco(ordem.endereco ?? "");
      setDataAgendada(ordem.data_agendada ?? "");
    } else if (open && !ordem) {
      setTitulo(""); setDescricao(""); setClienteId(""); setObraId("");
      setInstaladorId(""); setEndereco(""); setDataAgendada("");
    }
  }, [open, ordem]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      titulo,
      descricao: descricao || null,
      cliente_id: clienteId || null,
      obra_id: obraId || null,
      instalador_id: instaladorId || null,
      endereco: endereco || null,
      data_agendada: dataAgendada || null,
    };
    if (isEditing) {
      await atualizar.mutateAsync(payload);
    } else {
      await criar.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Nenhum</option>
                {(clientesData?.items ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obra">Instalação</Label>
              <select
                id="obra"
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Nenhuma</option>
                {(obrasData?.items ?? []).map((o) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instalador">Instalador responsável</Label>
            <select
              id="instalador"
              value={instaladorId}
              onChange={(e) => setInstaladorId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Não atribuído</option>
              {instaladores.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
            {instaladores.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum usuário com papel "Instalador" ainda. Convide um em Configurações.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data agendada</Label>
              <Input id="data" type="date" value={dataAgendada} onChange={(e) => setDataAgendada(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
