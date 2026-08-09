"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Landmark,
  Users,
  HardHat,
  Wallet,
  ShoppingCart,
  Boxes,
  NotebookPen,
  FileText,
  Truck,
  ClipboardList,
  CalendarDays,
  Settings,
  ShieldCheck,
  ShoppingBag,
  X,
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      setIsAdmin(email.toLowerCase() === SAAS_ADMIN_EMAIL.toLowerCase());
    });
  }, []);

  return (
    <>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Nova Empresa — visível apenas para o admin do SaaS */}
        {isAdmin && (
          <>
            <div className="my-2 border-t" />
            <Link
              href="/onboarding"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/onboarding")
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              Nova Empresa
            </Link>
          </>
        )}
      </nav>

      <div className="border-t p-3 text-xs text-muted-foreground">
        V3 · Construtec
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Image src="/images/logo-icone.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="font-semibold">Construtec</span>
        </div>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r bg-card">
            <div className="flex h-16 items-center justify-between gap-2 border-b px-6">
              <div className="flex items-center gap-2">
                <Image src="/images/logo-icone.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
                <span className="font-semibold">Construtec</span>
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
