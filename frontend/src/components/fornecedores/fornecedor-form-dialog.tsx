"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCriarFornecedor, useAtualizarFornecedor } from "@/hooks/use-fornecedores";
import type { Fornecedor } from "@/types";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  documento: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor?: Fornecedor | null;
}

export function FornecedorFormDialog({ open, onOpenChange, fornecedor }: Props) {
  const isEditing = Boolean(fornecedor);
  const criar = useCriarFornecedor();
  const atualizar = useAtualizarFornecedor();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset(fornecedor ? {
        nome: fornecedor.nome,
        documento: fornecedor.documento ?? "",
        email: fornecedor.email ?? "",
        telefone: fornecedor.telefone ?? "",
        endereco: fornecedor.endereco ?? "",
        observacoes: fornecedor.observacoes ?? "",
      } : { nome: "", documento: "", email: "", telefone: "", endereco: "", observacoes: "" });
    }
  }, [open, fornecedor, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      nome: values.nome,
      documento: values.documento || null,
      email: values.email || null,
      telefone: values.telefone || null,
      endereco: values.endereco || null,
      observacoes: values.observacoes || null,
    };
    try {
      if (isEditing && fornecedor) {
        await atualizar.mutateAsync({ id: fornecedor.id, data: payload });
      } else {
        await criar.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch { /* toast já exibido */ }
  }

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register("nome")} aria-invalid={Boolean(errors.nome)} />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="documento">CNPJ/CPF</Label>
              <Input id="documento" {...register("documento")} placeholder="Apenas dígitos" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register("telefone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register("endereco")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register("observacoes")} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
