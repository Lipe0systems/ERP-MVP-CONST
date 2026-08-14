"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, Power, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

interface EmpresaListItem {
  id: string;
  nome: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  qtd_usuarios: number;
  criado_em: string;
}

export function EmpresasList({ refreshKey }: { refreshKey?: number }) {
  const [empresas, setEmpresas] = useState<EmpresaListItem[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [alterando, setAlterando] = useState<string | null>(null);
  const [apagando, setApagando] = useState<string | null>(null);
  const [confirmarApagar, setConfirmarApagar] = useState<EmpresaListItem | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await apiFetch<EmpresaListItem[]>("/onboarding");
      setEmpresas(dados);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao carregar empresas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function alternarAtivo(empresa: EmpresaListItem) {
    setAlterando(empresa.id);
    try {
      await apiFetch(`/onboarding/${empresa.id}/ativo`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: !empresa.ativo }),
      });
      toast.success(empresa.ativo ? "Empresa desativada." : "Empresa ativada.");
      await carregar();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao alterar status.");
    } finally {
      setAlterando(null);
    }
  }

  async function apagarEmpresa(empresa: EmpresaListItem) {
    setApagando(empresa.id);
    try {
      const resultado = await apiFetch<{
        usuarios_removidos: number;
        falhas_ao_remover_login: string[];
      }>(`/onboarding/${empresa.id}`, { method: "DELETE" });

      if (resultado.falhas_ao_remover_login.length > 0) {
        toast.warning(
          `Empresa apagada, mas ${resultado.falhas_ao_remover_login.length} conta(s) de login não puderam ser removidas: ${resultado.falhas_ao_remover_login.join(", ")}. Remova manualmente no painel do Supabase, se necessário.`
        );
      } else {
        toast.success(`Empresa apagada — ${resultado.usuarios_removidos} conta(s) de login também removida(s).`);
      }
      setConfirmarApagar(null);
      await carregar();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao apagar empresa.");
    } finally {
      setApagando(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Empresas cadastradas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {carregando ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !empresas || empresas.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma empresa cadastrada.</p>
        ) : (
          empresas.map((empresa) => (
            <div
              key={empresa.id}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{empresa.nome}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      empresa.ativo
                        ? "bg-green-500/10 text-green-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {empresa.ativo ? "Ativa" : "Desativada"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{empresa.cnpj}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {empresa.qtd_usuarios} usuário(s)
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alternarAtivo(empresa)}
                  disabled={alterando === empresa.id}
                >
                  {alterando === empresa.id ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Power className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {empresa.ativo ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmarApagar(empresa)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}

        {confirmarApagar && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
            <p className="text-sm font-medium">
              Apagar <strong>{confirmarApagar.nome}</strong> permanentemente?
            </p>
            <p className="text-xs text-muted-foreground">
              Isso remove a empresa e TODOS os seus dados (clientes, obras, financeiro, etc.), além das
              contas de login de todos os usuários dela — não pode ser desfeito. Se quiser só bloquear o
              acesso sem perder os dados, use "Desativar" em vez disso.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmarApagar(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => apagarEmpresa(confirmarApagar)}
                disabled={apagando === confirmarApagar.id}
              >
                {apagando === confirmarApagar.id ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Apagar definitivamente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
