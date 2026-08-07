"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCriarCliente, useAtualizarCliente } from "@/hooks/use-clientes";
import { buscarCep } from "@/lib/api/clientes";
import type { ClienteV3 } from "@/types";

const schema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  documento: z.string().min(11, "CPF ou CNPJ inválido").max(18),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  rg: z.string().optional(),
  sexo: z.enum(["M", "F", "outro", ""]).optional(),
  data_nascimento: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: ClienteV3 | null;
}

export function ClienteFormDialog({ open, onOpenChange, cliente }: Props) {
  const isEditing = Boolean(cliente);
  const criar = useCriarCliente();
  const atualizar = useAtualizarCliente();
  const [buscandoCep, setBuscandoCep] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset(cliente ? {
        nome: cliente.nome,
        documento: cliente.documento,
        email: cliente.email ?? "",
        telefone: cliente.telefone ?? "",
        whatsapp: cliente.whatsapp ?? "",
        rg: cliente.rg ?? "",
        sexo: (cliente.sexo as any) ?? "",
        data_nascimento: cliente.data_nascimento ?? "",
        cep: cliente.cep ?? "",
        logradouro: cliente.logradouro ?? "",
        numero: cliente.numero ?? "",
        complemento: cliente.complemento ?? "",
        bairro: cliente.bairro ?? "",
        cidade: cliente.cidade ?? "",
        estado: cliente.estado ?? "",
        observacoes: cliente.observacoes ?? "",
      } : {
        nome: "", documento: "", email: "", telefone: "", whatsapp: "",
        rg: "", sexo: "", data_nascimento: "", cep: "", logradouro: "",
        numero: "", complemento: "", bairro: "", cidade: "", estado: "",
        observacoes: "",
      });
    }
  }, [open, cliente, reset]);

  async function handleBuscarCep() {
    const cep = watch("cep") ?? "";
    if (cep.replace(/\D/g, "").length !== 8) {
      toast.error("Digite um CEP com 8 dígitos.");
      return;
    }
    setBuscandoCep(true);
    try {
      const data = await buscarCep(cep);
      if (data.logradouro) setValue("logradouro", data.logradouro);
      if (data.bairro) setValue("bairro", data.bairro);
      if (data.cidade) setValue("cidade", data.cidade);
      if (data.estado) setValue("estado", data.estado);
      toast.success("Endereço preenchido automaticamente.");
    } catch {
      toast.error("CEP não encontrado.");
    } finally {
      setBuscandoCep(false);
    }
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      nome: values.nome,
      documento: values.documento.replace(/\D/g, ""),
      email: values.email || null,
      telefone: values.telefone || null,
      whatsapp: values.whatsapp || null,
      rg: values.rg || null,
      sexo: values.sexo || null,
      data_nascimento: values.data_nascimento || null,
      cep: values.cep?.replace(/\D/g, "") || null,
      logradouro: values.logradouro || null,
      numero: values.numero || null,
      complemento: values.complemento || null,
      bairro: values.bairro || null,
      cidade: values.cidade || null,
      estado: values.estado || null,
      observacoes: values.observacoes || null,
    };
    try {
      if (isEditing && cliente) {
        await atualizar.mutateAsync({ id: cliente.id, data: payload });
      } else {
        await criar.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch { /* toast já exibido */ }
  }

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="dados" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados pessoais</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="obs">Observações</TabsTrigger>
            </TabsList>

            {/* Aba 1 — Dados pessoais */}
            <TabsContent value="dados" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input id="nome" {...register("nome")} aria-invalid={Boolean(errors.nome)} />
                  {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">CPF / CNPJ *</Label>
                  <Input id="documento" {...register("documento")} placeholder="000.000.000-00" />
                  {errors.documento && <p className="text-xs text-destructive">{errors.documento.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input id="rg" {...register("rg")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <select
                    id="sexo"
                    {...register("sexo")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Não informado</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de nascimento</Label>
                  <Input id="data_nascimento" type="date" {...register("data_nascimento")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" {...register("telefone")} placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" {...register("whatsapp")} placeholder="(11) 99999-9999" />
                </div>
              </div>
            </TabsContent>

            {/* Aba 2 — Endereço com CEP automático */}
            <TabsContent value="endereco" className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" {...register("cep")} placeholder="00000-000" maxLength={9} />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBuscarCep}
                    disabled={buscandoCep}
                  >
                    {buscandoCep ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="ml-2">Buscar</span>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input id="logradouro" {...register("logradouro")} placeholder="Rua, Avenida..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" {...register("numero")} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" {...register("complemento")} placeholder="Apto, Sala..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" {...register("bairro")} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" {...register("cidade")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">UF</Label>
                  <Input id="estado" {...register("estado")} maxLength={2} placeholder="RJ" />
                </div>
              </div>
            </TabsContent>

            {/* Aba 3 — Observações */}
            <TabsContent value="obs">
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" {...register("observacoes")} rows={6} />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
