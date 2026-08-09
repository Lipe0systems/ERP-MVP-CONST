"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Building2, Landmark, Users, HardHat,
  Wallet, ShoppingCart, Boxes, NotebookPen, FileText,
  Truck, ClipboardList, ShieldCheck, ShoppingBag,
  CalendarDays, Settings, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const SAAS_ADMIN_EMAIL = "accuservpn@proton.me";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/obras", label: "Obras", icon: HardHat },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/diario-obra", label: "Diário de Obra", icon: NotebookPen },
  { href: "/banco", label: "Banco", icon: Landmark },
  { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { href: "/vendas", label: "Vendas", icon: ShoppingBag },
  { href: "/auditoria", label: "Auditoria", icon: ShieldCheck },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function NavItem({ href, label, icon: Icon, active, onClick }: {
  href: string; label: string; icon: React.ElementType;
  active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
        // Transição apenas nas props usadas
        "transition-[background-color,color] duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      {/* Indicador de ativo — barra lateral âmbar */}
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-amber-500" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-[color] duration-150",
          active ? "text-amber-500" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin((data.user?.email ?? "").toLowerCase() === SAAS_ADMIN_EMAIL.toLowerCase());
    });
  }, []);

  return (
    <>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <div key={href}>
            <NavItem
              href={href}
              label={label}
              icon={Icon}
              active={pathname.startsWith(href)}
              onClick={onNavigate}
            />
          </div>
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t" />
            <NavItem
              href="/onboarding"
              label="Nova Empresa"
              icon={Building2}
              active={pathname.startsWith("/onboarding")}
              onClick={onNavigate}
            />
          </>
        )}
      </nav>

      <div className="border-t px-4 py-3 text-[11px] text-muted-foreground/60 tracking-wide">
        CONSTRUTEC · V3
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center gap-2.5 border-b px-5">
          <Image src="/images/logo-icone.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          <span className="text-[15px] font-semibold tracking-tight">Construtec</span>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile drawer com animação */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Overlay com fade */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Drawer com slide da esquerda */}
          <aside className="absolute inset-y-0 left-0 flex w-60 flex-col border-r bg-card animate-in slide-in-from-left duration-300 [animation-timing-function:cubic-bezier(0.32,0.72,0,1)]">
            <div className="flex h-14 items-center justify-between gap-2 border-b px-5">
              <div className="flex items-center gap-2.5">
                <Image src="/images/logo-icone.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                <span className="text-[15px] font-semibold tracking-tight">Construtec</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onCloseMobile} aria-label="Fechar menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
