"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, ShieldAlert, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

const SAAS_ADMIN_EMAIL = "accuservpn@proton.me";

const schema = z.object({
  empresa_nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  empresa_cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").max(18),
  empresa_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  empresa_telefone: z.string().optional(),
  empresa_endereco: z.string().optional(),
  admin_nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  admin_email: z.string().email("E-mail inválido"),
  admin_senha: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  admin_senha_confirmacao: z.string(),
}).refine((d) => d.admin_senha === d.admin_senha_confirmacao, {
  message: "As senhas não coincidem",
  path: ["admin_senha_confirmacao"],
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [autorizado, setAutorizado] = useState<boolean | null>(null);

  // Verificar e-mail do usuário logado antes de mostrar qualquer coisa
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      setAutorizado(email.toLowerCase() === SAAS_ADMIN_EMAIL.toLowerCase());
    });
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const payload = {
        empresa_nome: values.empresa_nome,
        empresa_cnpj: values.empresa_cnpj.replace(/\D/g, ""),
        empresa_email: values.empresa_email || null,
        empresa_telefone: values.empresa_telefone || null,
        empresa_endereco: values.empresa_endereco || null,
        admin_nome: values.admin_nome,
        admin_email: values.admin_email,
        admin_senha: values.admin_senha,
      };

      const resultado = await apiFetch<{
        mensagem: string;
        empresa_id: string;
        access_token?: string;
        refresh_token?: string;
      }>("/onboarding", { method: "POST", body: JSON.stringify(payload) });

      toast.success("Empresa criada com sucesso!");
      reset();

      // Login automático na nova empresa
      if (resultado.access_token && resultado.refresh_token) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: resultado.access_token,
          refresh_token: resultado.refresh_token,
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao criar empresa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Carregando verificação
  if (autorizado === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Acesso negado
  if (!autorizado) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta área é exclusiva do administrador do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova Empresa</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre uma nova empresa e seu primeiro usuário administrador
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>Informações da construtora que será cadastrada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="empresa_nome">Razão social *</Label>
                <Input id="empresa_nome" {...register("empresa_nome")} placeholder="Construtora Exemplo Ltda" />
                {errors.empresa_nome && <p className="text-xs text-destructive">{errors.empresa_nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa_cnpj">CNPJ *</Label>
                <Input id="empresa_cnpj" {...register("empresa_cnpj")} placeholder="00.000.000/0001-00" />
                {errors.empresa_cnpj && <p className="text-xs text-destructive">{errors.empresa_cnpj.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="empresa_email">E-mail</Label>
                <Input id="empresa_email" type="email" {...register("empresa_email")} placeholder="contato@empresa.com.br" />
                {errors.empresa_email && <p className="text-xs text-destructive">{errors.empresa_email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa_telefone">Telefone</Label>
                <Input id="empresa_telefone" {...register("empresa_telefone")} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa_endereco">Endereço</Label>
              <Input id="empresa_endereco" {...register("empresa_endereco")} placeholder="Rua, número, bairro, cidade - UF" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              Usuário Administrador
            </CardTitle>
            <CardDescription>Credenciais do primeiro acesso à empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin_nome">Nome completo *</Label>
                <Input id="admin_nome" {...register("admin_nome")} placeholder="João Silva" />
                {errors.admin_nome && <p className="text-xs text-destructive">{errors.admin_nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_email">E-mail de acesso *</Label>
                <Input id="admin_email" type="email" {...register("admin_email")} placeholder="admin@empresa.com.br" />
                {errors.admin_email && <p className="text-xs text-destructive">{errors.admin_email.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin_senha">Senha *</Label>
                <Input id="admin_senha" type="password" {...register("admin_senha")} placeholder="Mínimo 8 caracteres" />
                {errors.admin_senha && <p className="text-xs text-destructive">{errors.admin_senha.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_senha_confirmacao">Confirmar senha *</Label>
                <Input id="admin_senha_confirmacao" type="password" {...register("admin_senha_confirmacao")} placeholder="Repita a senha" />
                {errors.admin_senha_confirmacao && <p className="text-xs text-destructive">{errors.admin_senha_confirmacao.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando empresa...</>
            ) : (
              <><Building2 className="mr-2 h-4 w-4" />Criar empresa</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
