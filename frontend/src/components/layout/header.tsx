"use client";

import { Moon, Sun, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { NotificacoesPopover } from "@/components/notificacoes/notificacoes-popover";
import { BuscaGlobal } from "@/components/busca/busca-global";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PAPEL_USUARIO_LABEL } from "@/types";

interface HeaderProps { onMenuClick?: () => void; }

/** Iniciais para o avatar (ex.: "Carlos Mendes" → "CM"). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { me } = useCurrentUser();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Limpa TODO o cache do React Query no logout. Sem isto, os dados da
    // empresa anterior continuariam em memória — e se outra pessoa
    // logasse na mesma aba sem recarregar a página, poderia ver dados
    // cacheados de outro tenant antes da primeira revalidação chegar.
    // Isolamento multi-tenant precisa valer no cache do cliente também,
    // não só no backend.
    queryClient.clear();
    router.push("/login");
    router.refresh();
  }

  // O nome real do usuário não vem em /auth/me (só id/email/empresa/papel),
  // então o avatar usa o e-mail como base — evita inventar um nome que o
  // backend não forneceu.
  const identificador = me?.email ?? "";
  const nomeExibicao = identificador.split("@")[0] || "Usuário";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <BuscaGlobal />
      </div>

      <div className="flex items-center gap-1">
        <NotificacoesPopover />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Alternar tema"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>

        {/* Identidade do usuário — some em telas estreitas para não competir
            com a busca; o botão de sair continua acessível ao lado. */}
        {me && (
          <div className="ml-2 hidden items-center gap-2.5 border-l pl-3 sm:flex">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground"
              aria-hidden
            >
              {iniciais(nomeExibicao)}
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-medium capitalize">{nomeExibicao}</p>
              <p className="text-[11px] text-muted-foreground">{PAPEL_USUARIO_LABEL[me.papel]}</p>
            </div>
          </div>
        )}

        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
