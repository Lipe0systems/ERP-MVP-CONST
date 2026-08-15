"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Building2, Landmark, Users, HardHat,
  Wallet, ShoppingCart, Boxes, NotebookPen, FileText,
  Truck, ClipboardList, ShieldCheck, ShoppingBag,
  CalendarDays, Settings, Database, Briefcase, Trash2, Workflow, X,
  ChevronLeft, ChevronRight, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

const SAAS_ADMIN_EMAIL = "accuservpn@proton.me";

// Cada item tem uma cor-tema (usada no glow do ícone ativo e hover)
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, cor: "amber" },
  { href: "/workspace", label: "Workspace", icon: Workflow, cor: "purple" },
  { href: "/clientes", label: "Clientes", icon: Users, cor: "blue" },
  { href: "/obras", label: "Obras", icon: HardHat, cor: "amber" },
  { href: "/ordens-servico", label: "Ordens de Serviço", icon: Wrench, cor: "amber" },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, cor: "green" },
  { href: "/compras", label: "Compras", icon: ShoppingCart, cor: "purple" },
  { href: "/estoque", label: "Estoque", icon: Boxes, cor: "cyan" },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck, cor: "green" },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText, cor: "purple" },
  { href: "/diario-obra", label: "Diário de Obra", icon: NotebookPen, cor: "amber" },
  { href: "/banco", label: "Banco", icon: Landmark, cor: "cyan" },
  { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList, cor: "blue" },
  { href: "/vendas", label: "Vendas", icon: ShoppingBag, cor: "green" },
  { href: "/rh", label: "RH", icon: Briefcase, cor: "purple" },
  { href: "/auditoria", label: "Auditoria", icon: ShieldCheck, cor: "purple" },
  { href: "/calendario", label: "Calendário", icon: CalendarDays, cor: "cyan" },
  { href: "/backup", label: "Backup", icon: Database, cor: "cyan" },
  { href: "/lixeira", label: "Lixeira", icon: Trash2, cor: "amber" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, cor: "amber" },
] as const;

// Um usuário com papel "instalador" só enxerga este único módulo — o
// backend já bloqueia qualquer outra rota para ele (core/security.py),
// então esconder o resto do menu é sobre experiência, não sobre segurança
// (a segurança de verdade não depende de esconder botão nenhum). Não inclui
// /configuracoes: essa tela chama endpoints (ex.: listar usuários) que o
// backend não libera para esse papel — mostrar o link levaria a uma tela
// quebrada com erros 403, então nem aparece.
const MODULOS_INSTALADOR = new Set(["/ordens-servico"]);

type Cor = "amber" | "blue" | "green" | "purple" | "cyan";

// Cor do ícone quando o item está ativo
const ICON_ATIVO: Record<Cor, string> = {
  amber: "text-amber-500",
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
  cyan: "text-cyan-500",
};
// Cor do glow do ícone ativo
const GLOW_ATIVO: Record<Cor, string> = {
  amber: "shadow-[0_0_12px_-2px_rgb(245,158,11,0.6)]",
  blue: "shadow-[0_0_12px_-2px_rgb(59,130,246,0.6)]",
  green: "shadow-[0_0_12px_-2px_rgb(34,197,94,0.6)]",
  purple: "shadow-[0_0_12px_-2px_rgb(168,85,247,0.6)]",
  cyan: "shadow-[0_0_12px_-2px_rgb(6,182,212,0.6)]",
};

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function NavItem({ href, label, icon: Icon, cor, active, onClick, recolhida }: {
  href: string; label: string; icon: React.ElementType; cor: Cor;
  active: boolean; onClick?: () => void; recolhida?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={recolhida ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "transition-[background-color,color,transform] duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
        "active:scale-[0.98]",
        recolhida && "justify-center px-0",
        active
          ? "bg-gradient-to-r from-amber-500/[0.12] to-transparent text-foreground"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      )}
    >
      {/* Pílula indicadora à esquerda, com gradiente */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full bg-grad-brand transition-all duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
          active ? "w-1 opacity-100" : "w-0 opacity-0"
        )}
      />

      {/* Ícone em mini-cápsula que ganha glow quando ativo */}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
          active
            ? cn("bg-card", GLOW_ATIVO[cor])
            : "group-hover:bg-card/60"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
            active ? ICON_ATIVO[cor] : "text-muted-foreground group-hover:text-foreground"
          )}
        />
      </span>
      {!recolhida && label}
    </Link>
  );
}

function SidebarContent({ onNavigate, recolhida }: { onNavigate?: () => void; recolhida?: boolean }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const { isInstalador } = useCurrentUser();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin((data.user?.email ?? "").toLowerCase() === SAAS_ADMIN_EMAIL.toLowerCase());
    });
  }, []);

  const itensVisiveis = isInstalador
    ? navItems.filter((item) => MODULOS_INSTALADOR.has(item.href))
    : navItems;

  return (
    <>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {itensVisiveis.map(({ href, label, icon: Icon, cor }) => (
          <div key={href}>
            <NavItem
              href={href}
              label={label}
              icon={Icon}
              cor={cor}
              active={pathname.startsWith(href)}
              onClick={onNavigate}
              recolhida={recolhida}
            />
          </div>
        ))}

        {isAdmin && !isInstalador && (
          <>
            <div className="my-3 flex items-center gap-2 px-3">
              <div className="h-px flex-1 bg-border" />
              {!recolhida && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Admin</span>
              )}
              <div className="h-px flex-1 bg-border" />
            </div>
            <NavItem
              href="/onboarding"
              label="Nova Empresa"
              icon={Building2}
              cor="amber"
              active={pathname.startsWith("/onboarding")}
              onClick={onNavigate}
              recolhida={recolhida}
            />
          </>
        )}
      </nav>

      {/* Rodapé com badge de versão gradiente */}
      <div className="border-t border-border/60 px-4 py-3">
        <div className={cn("flex items-center gap-2", recolhida && "justify-center")}>
          <span className="inline-flex items-center rounded-md bg-grad-brand-soft px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            V3
          </span>
          {!recolhida && (
            <span className="text-[11px] tracking-wide text-muted-foreground/50">Construtec ERP</span>
          )}
        </div>
      </div>
    </>
  );
}

function SidebarBrand({ recolhida }: { recolhida?: boolean }) {
  return (
    <div className={cn("flex h-14 items-center gap-2.5 border-b border-border/60 px-5", recolhida && "justify-center px-0")}>
      <div className="relative">
        <div className="absolute inset-0 rounded-xl bg-amber-500/40 blur-md" />
        <Image src="/images/logo-icone.png" alt="" width={28} height={28} className="relative h-7 w-7 object-contain" />
      </div>
      {!recolhida && (
        <span className="text-[15px] font-bold tracking-tight">
          Constru<span className="text-gradient-brand">tec</span>
        </span>
      )}
    </div>
  );
}

const SIDEBAR_RECOLHIDA_KEY = "sidebar-recolhida";

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const [recolhida, setRecolhida] = useState(false);
  const [pronta, setPronta] = useState(false);

  // Lê a preferência salva só depois de montar — evita "flash" de sidebar
  // expandida antes de aplicar o estado recolhido salvo (mesmo cuidado já
  // usado no restante do sistema para preferências salvas no navegador).
  useEffect(() => {
    const salvo = window.localStorage.getItem(SIDEBAR_RECOLHIDA_KEY);
    if (salvo === "1") setRecolhida(true);
    setPronta(true);
  }, []);

  function alternar() {
    setRecolhida((atual) => {
      const novo = !atual;
      window.localStorage.setItem(SIDEBAR_RECOLHIDA_KEY, novo ? "1" : "0");
      return novo;
    });
  }

  return (
    <>
      {/* Desktop — fundo com gradiente vertical sutil + mesh no topo */}
      <aside
        className={cn(
          "relative hidden shrink-0 flex-col border-r border-border/60 md:flex bg-gradient-to-b from-card to-secondary/40",
          "transition-[width] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
          recolhida ? "w-[68px]" : "w-60",
          // Evita a transição de largura rodar no primeiro render (antes de
          // saber se havia preferência salva) — senão dá pra ver o "encolher".
          !pronta && "transition-none"
        )}
      >
        {/* Glow ambiente no topo da sidebar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-500/[0.06] to-transparent" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <SidebarBrand recolhida={recolhida} />
          <SidebarContent recolhida={recolhida} />
        </div>

        {/* Botão de recolher/expandir — flutua na borda direita, meio da altura */}
        <button
          onClick={alternar}
          aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
          title={recolhida ? "Expandir menu" : "Recolher menu"}
          className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        >
          {recolhida ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile drawer — sempre largura cheia, recolher não se aplica a overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-60 flex-col border-r border-border/60 bg-gradient-to-b from-card to-secondary/40 animate-in slide-in-from-left duration-300 [animation-timing-function:cubic-bezier(0.32,0.72,0,1)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-500/[0.06] to-transparent" />
            <div className="relative flex h-14 items-center justify-between gap-2 border-b border-border/60 px-5">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-amber-500/40 blur-md" />
                  <Image src="/images/logo-icone.png" alt="" width={28} height={28} className="relative h-7 w-7 object-contain" />
                </div>
                <span className="text-[15px] font-bold tracking-tight">
                  Constru<span className="text-gradient-brand">tec</span>
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onCloseMobile} aria-label="Fechar menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative flex flex-1 flex-col">
              <SidebarContent onNavigate={onCloseMobile} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
