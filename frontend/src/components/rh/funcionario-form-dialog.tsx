"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCriarFuncionario, useAtualizarFuncionario } from "@/hooks/use-rh";
import { TIPO_CONTRATACAO, TIPO_CONTRATACAO_LABEL } from "@/types";
import type { Funcionario } from "@/types";

const schema = z.object({
  nome: z.string().min(1, "Informe o nome").max(255),
  cpf: z.string().max(11).optional().or(z.literal("")),
  cargo: z.string().max(120).optional().or(z.literal("")),
  salario: z.coerce.number().min(0),
  tipo_contratacao: z.enum(TIPO_CONTRATACAO),
  data_admissao: z.string().optional().or(z.literal("")),
  telefone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});
type F = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  funcionario?: Funcionario | null;
}

export function FuncionarioFormDialog({ open, onOpenChange, funcionario }: Props) {
  const criar = useCriarFuncionario();
  const atualizar = useAtualizarFuncionario();
  const editando = Boolean(funcionario);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", salario: "" as unknown as number, tipo_contratacao: "clt" },
  });

  useEffect(() => {
    if (open) {
      reset(funcionario ? {
        nome: funcionario.nome,
        cpf: funcionario.cpf ?? "",
        cargo: funcionario.cargo ?? "",
        salario: funcionario.salario,
        tipo_contratacao: funcionario.tipo_contratacao,
        data_admissao: funcionario.data_admissao ?? "",
        telefone: funcionario.telefone ?? "",
        email: funcionario.email ?? "",
        observacoes: funcionario.observacoes ?? "",
      } : { nome: "", salario: "" as unknown as number, tipo_contratacao: "clt", cpf: "", cargo: "", data_admissao: "", telefone: "", email: "", observacoes: "" });
    }
  }, [open, funcionario, reset]);

  async function onSubmit(values: F) {
    const body = {
      nome: values.nome,
      cpf: values.cpf || null,
      cargo: values.cargo || null,
      salario: Number(values.salario),
      tipo_contratacao: values.tipo_contratacao,
      data_admissao: values.data_admissao || null,
      telefone: values.telefone || null,
      email: values.email || null,
      ativo: true,
      observacoes: values.observacoes || null,
    };
    try {
      if (editando && funcionario) await atualizar.mutateAsync({ id: funcionario.id, body });
      else await criar.mutateAsync(body);
      onOpenChange(false);
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register("nome")} placeholder="Nome completo" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" {...register("cargo")} placeholder="Pedreiro, Mestre de obras..." />
            </div>
            <div className="space-y-2">
              <Label>Tipo de contratação</Label>
              <select {...register("tipo_contratacao")} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm">
                {TIPO_CONTRATACAO.map((t) => <option key={t} value={t}>{TIPO_CONTRATACAO_LABEL[t]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="salario">Salário / diária (R$)</Label>
              <Input id="salario" type="number" step="0.01" min={0} placeholder="0,00" {...register("salario")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_admissao">Admissão</Label>
              <Input id="data_admissao" type="date" {...register("data_admissao")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...register("cpf")} placeholder="Só números" maxLength={11} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register("telefone")} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" rows={2} {...register("observacoes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={criar.isPending || atualizar.isPending}>
              {editando ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
