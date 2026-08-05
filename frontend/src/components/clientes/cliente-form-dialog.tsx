"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

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
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCpfCnpj, isValidCpfCnpj, onlyDigits } from "@/lib/validators";
import { useAtualizarCliente, useCriarCliente } from "@/hooks/use-clientes";
import type { Cliente } from "@/types";

const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),
  documento: z
    .string()
    .min(11, "Documento incompleto.")
    .refine((v) => isValidCpfCnpj(v), "CPF/CNPJ inválido."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().trim().optional().or(z.literal("")),
  endereco: z.string().trim().optional().or(z.literal("")),
  observacoes: z.string().trim().optional().or(z.literal("")),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
}

export function ClienteFormDialog({ open, onOpenChange, cliente }: ClienteFormDialogProps) {
  const isEditing = Boolean(cliente);
  const criar = useCriarCliente();
  const atualizar = useAtualizarCliente();
  const loading = criar.isPending || atualizar.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nome: "", documento: "", email: "", telefone: "", endereco: "", observacoes: "" },
  });

  // Sincroniza o formulário sempre que o modal abre — tanto para edição
  // (preenche com os dados do cliente) quanto para criação (limpa os campos).
  useEffect(() => {
    if (!open) return;
    reset(
      cliente
        ? {
            nome: cliente.nome,
            documento: formatCpfCnpj(cliente.documento),
            email: cliente.email ?? "",
            telefone: cliente.telefone ?? "",
            endereco: cliente.endereco ?? "",
            observacoes: cliente.observacoes ?? "",
          }
        : { nome: "", documento: "", email: "", telefone: "", endereco: "", observacoes: "" }
    );
  }, [open, cliente, reset]);

  const documento = watch("documento");

  function onDocumentoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("documento", formatCpfCnpj(e.target.value), { shouldValidate: true });
  }

  async function onSubmit(values: ClienteFormValues) {
    const payload = {
      nome: values.nome,
      documento: onlyDigits(values.documento),
      email: values.email || null,
      telefone: values.telefone || null,
      endereco: values.endereco || null,
      observacoes: values.observacoes || null,
    };

    try {
      if (isEditing && cliente) {
        await atualizar.mutateAsync({ id: cliente.id, data: payload });
      } else {
        await criar.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // Erro já foi exibido via toast pelo onError dos hooks de mutação;
      // aqui só evitamos que a rejeição da Promise fique sem tratamento
      // e mantemos o modal aberto para o usuário corrigir e tentar de novo.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do cliente." : "Preencha os dados para cadastrar um novo cliente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
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
              <Label htmlFor="documento">CPF/CNPJ *</Label>
              <Input
                id="documento"
                value={documento}
                maxLength={18}
                placeholder="000.000.000-00"
                aria-invalid={Boolean(errors.documento)}
                aria-describedby={errors.documento ? "documento-error" : undefined}
                {...register("documento")}
                onChange={onDocumentoChange}
              />
              {errors.documento && (
                <p id="documento-error" className="text-xs text-destructive">
                  {errors.documento.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" placeholder="(00) 00000-0000" {...register("telefone")} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" {...register("endereco")} />
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
              {isEditing ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
