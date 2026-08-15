"use client";

import { useState } from "react";
import { Copy, Link2, Plus, Settings, Shield, Trash2, UserCheck, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useUsuarios, useConvites, useCriarConvite, useCancelarConvite, useAtualizarPapel, useRemoverUsuario } from "@/hooks/use-usuarios";
import { PAPEL_USUARIO, PAPEL_USUARIO_LABEL, STATUS_CONVITE } from "@/types";
import type { Convite, PapelUsuario, StatusConvite, Usuario } from "@/types";
import { formatData } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<StatusConvite, string> = {
  pendente: "bg-amber-100 text-amber-700",
  aceito: "bg-green-100 text-green-700",
  expirado: "bg-muted text-muted-foreground",
  cancelado: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<StatusConvite, string> = {
  pendente: "Pendente", aceito: "Aceito", expirado: "Expirado", cancelado: "Cancelado",
};

const PAPEL_COLOR: Record<PapelUsuario, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  membro: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  visualizador: "bg-muted text-muted-foreground",
  instalador: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  papel: z.enum(PAPEL_USUARIO),
});
type F = z.infer<typeof schema>;

function NovoConviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const criar = useCriarConvite();
  const [linkGerado, setLinkGerado] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", papel: "membro" },
  });

  async function onSubmit(values: F) {
    try {
      const convite = await criar.mutateAsync({ email: values.email, papel: values.papel });
      setLinkGerado(convite.link_aceite);
    } catch {}
  }

  function handleClose() {
    setLinkGerado(null);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
        </DialogHeader>
        {linkGerado ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Convite criado! Copie o link abaixo e envie ao usuário. O link expira em 7 dias.</p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <p className="flex-1 truncate text-xs font-mono">{linkGerado}</p>
              <Button
                variant="ghost" size="icon"
                onClick={() => { navigator.clipboard.writeText(linkGerado); toast.success("Link copiado!"); }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail do usuário *</Label>
              <Input id="email" type="email" {...register("email")} placeholder="usuario@exemplo.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <select {...register("papel")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {PAPEL_USUARIO.map((p) => <option key={p} value={p}>{PAPEL_USUARIO_LABEL[p]}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">
                Administrador pode convidar usuários e alterar papéis. Visualizador só lê dados.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={criar.isPending}>{criar.isPending ? "Enviando..." : "Criar convite"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ConfiguracoesPage() {
  const { data: usuarios = [], isLoading: loadU } = useUsuarios();
  const { data: convites = [], isLoading: loadC } = useConvites();
  const cancelarConvite = useCancelarConvite();
  const atualizarPapel = useAtualizarPapel();
  const removerUsuario = useRemoverUsuario();

  const [novoConviteOpen, setNovoConviteOpen] = useState(false);
  const [removendo, setRemovendo] = useState<Usuario | null>(null);
  const [linkVisivel, setLinkVisivel] = useState<string | null>(null);

  const convitesPendentes = convites.filter((c) => c.status === "pendente");

  return (
    <div className="space-y-8">
      <PageHeader icon={Settings} title="Configurações" subtitle="Gerencie os usuários e acessos da sua empresa" cor="brand" />

      {/* Usuários ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Usuários da empresa</CardTitle>
          </div>
          <Button size="sm" onClick={() => setNovoConviteOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Convidar
          </Button>
        </CardHeader>
        <CardContent>
          {loadU ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : usuarios.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
          ) : (
            <div className="divide-y">
              {usuarios.map((u) => (
                <div key={u.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-sm">
                    {u.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.papel}
                      onChange={(e) => atualizarPapel.mutate({ id: u.id, papel: e.target.value as PapelUsuario })}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {PAPEL_USUARIO.map((p) => <option key={p} value={p}>{PAPEL_USUARIO_LABEL[p]}</option>)}
                    </select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRemovendo(u)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convites pendentes */}
      {(loadC || convitesPendentes.length > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Link2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadC ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="divide-y">
                {convitesPendentes.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {PAPEL_USUARIO_LABEL[c.papel as PapelUsuario]} · expira {formatData(c.expira_em)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLOR[c.status as StatusConvite])}>
                        {STATUS_LABEL[c.status as StatusConvite]}
                      </span>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        title="Copiar link"
                        onClick={() => { navigator.clipboard.writeText(c.link_aceite); toast.success("Link copiado!"); }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => cancelarConvite.mutate(c.id)}
                        disabled={cancelarConvite.isPending}
                      >
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Papéis explicados */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Sobre os papéis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { papel: "admin" as const, desc: "Acesso total: pode convidar usuários, alterar papéis, e gerenciar todos os módulos." },
            { papel: "membro" as const, desc: "Acesso operacional: pode criar, editar e visualizar registros em todos os módulos." },
            { papel: "visualizador" as const, desc: "Acesso somente leitura: visualiza dados mas não pode criar ou editar." },
            { papel: "instalador" as const, desc: "Acesso restrito: só vê as Ordens de Serviço atribuídas a ele mesmo, e pode marcá-las como concluídas com foto." },
          ].map(({ papel, desc }) => (
            <div key={papel} className="flex items-start gap-3">
              <span className={cn("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", PAPEL_COLOR[papel])}>
                {PAPEL_USUARIO_LABEL[papel]}
              </span>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <NovoConviteDialog open={novoConviteOpen} onOpenChange={setNovoConviteOpen} />

      <DeleteConfirmDialog
        titulo="Remover usuário"
        open={Boolean(removendo)}
        onOpenChange={(o) => !o && setRemovendo(null)}
        descricao={removendo ? `${removendo.nome} (${removendo.email})` : undefined}
        isPending={removerUsuario.isPending}
        onConfirm={() => { if (removendo) return removerUsuario.mutateAsync(removendo.id); }}
      />
    </div>
  );
}
