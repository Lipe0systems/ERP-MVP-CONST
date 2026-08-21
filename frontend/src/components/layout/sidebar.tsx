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
import { useNavPrefetch } from "@/hooks/use-nav-prefetch";

const SAAS_ADMIN_EMAIL = "accuservpn@proton.me";

/**
 * Navegação agrupada, seguindo a referência visual do redesign.
 *
 * Os 20 módulos existentes foram PRESERVADOS — apenas reorganizados em
 * grupos temáticos. A referência mostrava só uma parte deles; os demais
 * foram encaixados no grupo que faz sentido, e os utilitários de
 * manutenção ganharam um grupo "Sistema" próprio no rodapé do menu.
 *
 * "Visão geral" fica solto no topo, fora de qualquer grupo — é o destino
 * padrão e não compete com as seções.
 */
interface NavItemDef {
  href: string;
  label: string;
  icon: React.ElementType;
  cor: Cor;
}

interface NavGrupo {
  titulo: string;
  itens: NavItemDef[];
}

type Cor = "amber" | "blue" | "green" | "purple" | "cyan";

// Cor do ícone quando o item está ativo
const ICON_ATIVO: Record<Cor, string> = {
  amber: "text-amber-500",
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
  cyan: "text-cyan-500",
};
// Glow do ícone ativo
const GLOW_ATIVO: Record<Cor, string> = {
  amber: "shadow-[0_0_12px_-2px_rgb(245,158,11,0.6)]",
  blue: "shadow-[0_0_12px_-2px_rgb(59,130,246,0.6)]",
  green: "shadow-[0_0_12px_-2px_rgb(34,197,94,0.6)]",
  purple: "shadow-[0_0_12px_-2px_rgb(168,85,247,0.6)]",
  cyan: "shadow-[0_0_12px_-2px_rgb(6,182,212,0.6)]",
};

const navPrincipal: NavItemDef = { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard, cor: "amber" };

const navGrupos: NavGrupo[] = [
  {
    titulo: "Operação",
    itens: [
      { href: "/obras", label: "Obras", icon: HardHat , cor: "amber" },
      { href: "/clientes", label: "Clientes", icon: Users , cor: "blue" },
      { href: "/diario-obra", label: "Diário de Obra", icon: NotebookPen , cor: "amber" },
      { href: "/ordens-servico", label: "Ordens de Serviço", icon: Wrench , cor: "amber" },
      { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList , cor: "blue" },
    ],
  },
  {
    titulo: "Comercial",
    itens: [
      { href: "/orcamentos", label: "Orçamentos", icon: FileText , cor: "purple" },
      { href: "/vendas", label: "Vendas", icon: ShoppingBag , cor: "green" },
      { href: "/workspace", label: "Workspace", icon: Workflow , cor: "purple" },
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      { href: "/financeiro", label: "Contas", icon: Wallet , cor: "green" },
      { href: "/banco", label: "Fluxo de caixa", icon: Landmark , cor: "cyan" },
    ],
  },
  {
    titulo: "Suprimentos",
    itens: [
      { href: "/compras", label: "Compras", icon: ShoppingCart , cor: "purple" },
      { href: "/estoque", label: "Estoque", icon: Boxes , cor: "cyan" },
      { href: "/fornecedores", label: "Fornecedores", icon: Truck , cor: "green" },
    ],
  },
  {
    titulo: "Gestão",
    itens: [
      { href: "/rh", label: "RH", icon: Briefcase , cor: "purple" },
      { href: "/calendario", label: "Calendário", icon: CalendarDays , cor: "cyan" },
    ],
  },
  {
    titulo: "Sistema",
    itens: [
      { href: "/auditoria", label: "Auditoria", icon: ShieldCheck , cor: "purple" },
      { href: "/backup", label: "Backup", icon: Database , cor: "cyan" },
      { href: "/lixeira", label: "Lixeira", icon: Trash2 , cor: "amber" },
      { href: "/configuracoes", label: "Configurações", icon: Settings , cor: "amber" },
    ],
  },
];

// Lista achatada — usada pelo filtro do instalador e por qualquer lógica
// que precise percorrer todos os itens sem se importar com o agrupamento.
const todosItens = [navPrincipal, ...navGrupos.flatMap((g) => g.itens)];

// Um usuário com papel "instalador" só enxerga este único módulo — o
// backend já bloqueia qualquer outra rota para ele (core/security.py),
// então esconder o resto do menu é sobre experiência, não sobre segurança
// (a segurança de verdade não depende de esconder botão nenhum). Não inclui
// /configuracoes: essa tela chama endpoints (ex.: listar usuários) que o
// backend não libera para esse papel — mostrar o link levaria a uma tela
// quebrada com erros 403, então nem aparece.
const MODULOS_INSTALADOR = new Set(["/ordens-servico"]);

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Item de navegação — padrão da referência do redesign.
 *
 * Mudou em relação à versão anterior: cada módulo tinha uma cor-tema
 * própria (5 cores) + glow colorido no ícone ativo. Isso brigava com
 * "laranja é acento" e deixava o menu com cara de arco-íris. Agora o
 * estado ativo é comunicado por 3 sinais discretos e monocromáticos:
 * fundo levemente tingido, barra laranja à esquerda e ícone laranja.
 */
function NavItem({ href, label, icon: Icon, cor, active, onClick, recolhida }: {
  href: string; label: string; icon: React.ElementType; cor: Cor;
  active: boolean; onClick?: () => void; recolhida?: boolean;
}) {
  // Prefetch dos DADOS ao passar o mouse (o <Link> já faz prefetch da
  // rota). Ver comentários em use-nav-prefetch.ts.
  const { prefetch, cancelar } = useNavPrefetch();

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => prefetch(href)}
      onMouseLeave={cancelar}
      onFocus={() => prefetch(href)}
      title={recolhida ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        // Espaçamento mais generoso (py-2.5) e cantos maiores, seguindo a
        // referência. Ícone e navegação permanecem intocados.
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium",
        "transition-[background-color,color] duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
        recolhida && "justify-center px-0",
        active
          // Estado ativo com mais presença: gradiente lateral suave da cor
          // da marca, que esvai para a direita (como na referência).
          ? "bg-gradient-to-r from-primary/[0.16] via-primary/[0.06] to-transparent text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {/* Barra indicadora à esquerda */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full bg-primary transition-[width,opacity] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
          active ? "w-[3px] opacity-100" : "w-0 opacity-0"
        )}
      />

      {/* Ícone em mini-cápsula, com cor e glow por módulo (visual original) */}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-[background-color,box-shadow] duration-150",
          active ? cn("bg-card", GLOW_ATIVO[cor]) : "group-hover:bg-card/60"
        )}
      >
        <Icon
          className={cn(
            "h-[17px] w-[17px] shrink-0 transition-colors duration-150",
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

  // Instalador vê uma lista achatada com o único módulo permitido — sem
  // títulos de grupo, que só fariam sentido com vários itens.
  if (isInstalador) {
    const itens = todosItens.filter((i) => MODULOS_INSTALADOR.has(i.href));
    return (
      <>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {itens.map(({ href, label, icon: Icon, cor }) => (
            <NavItem
              key={href} href={href} label={label} icon={Icon} cor={cor}
              active={pathname.startsWith(href)} onClick={onNavigate} recolhida={recolhida}
            />
          ))}
        </nav>
        <SidebarRodape recolhida={recolhida} />
      </>
    );
  }

  return (
    <>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {/* Destino padrão, fora de qualquer grupo */}
        <NavItem
          href={navPrincipal.href}
          label={navPrincipal.label}
          icon={navPrincipal.icon}
          cor={navPrincipal.cor}
          active={pathname.startsWith(navPrincipal.href)}
          onClick={onNavigate}
          recolhida={recolhida}
        />

        {navGrupos.map((grupo) => (
          <div key={grupo.titulo} className="mt-5 first:mt-4">
            {/* Título do grupo some quando recolhida — vira só um respiro
                entre os blocos de ícones, sem texto cortado. */}
            {recolhida ? (
              <div className="mx-auto mb-2 h-px w-6 bg-border" />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wide text-muted-foreground/70">
                {grupo.titulo}
              </p>
            )}
            <div className="space-y-0.5">
              {grupo.itens.map(({ href, label, icon: Icon, cor }) => (
                <NavItem
                  key={href} href={href} label={label} icon={Icon} cor={cor}
                  active={pathname.startsWith(href)} onClick={onNavigate} recolhida={recolhida}
                />
              ))}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div className="mt-5">
            {recolhida ? (
              <div className="mx-auto mb-2 h-px w-6 bg-border" />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wide text-muted-foreground/70">
                Administração
              </p>
            )}
            <NavItem
              href="/onboarding"
              label="Nova Empresa"
              icon={Building2}
              cor="amber"
              active={pathname.startsWith("/onboarding")}
              onClick={onNavigate}
              recolhida={recolhida}
            />
          </div>
        )}
      </nav>
      <SidebarRodape recolhida={recolhida} />
    </>
  );
}

function SidebarRodape({ recolhida }: { recolhida?: boolean }) {
  return (
    <div className="border-t border-border/60 px-4 py-3">
      <div className={cn("flex items-center gap-2", recolhida && "justify-center")}>
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          V4
        </span>
        {!recolhida && (
          <span className="text-[11px] tracking-wide text-muted-foreground/60">Inovak Serviços</span>
        )}
      </div>
    </div>
  );
}

function SidebarBrand({ recolhida }: { recolhida?: boolean }) {
  return (
    <div className={cn("flex h-14 items-center gap-2.5 border-b border-border/60 px-5", recolhida && "justify-center px-0")}>
      <Image src="/images/logo-icone.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      {!recolhida && (
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight">Inovak</p>
          <p className="text-[10px] tracking-wide text-muted-foreground">ERP</p>
        </div>
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
          "relative hidden shrink-0 flex-col border-r border-border/60 md:flex bg-background",
          "transition-[width] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
          recolhida ? "w-[68px]" : "w-60",
          // Evita a transição de largura rodar no primeiro render (antes de
          // saber se havia preferência salva) — senão dá pra ver o "encolher".
          !pronta && "transition-none"
        )}
      >
        {/* Glow ambiente no topo da sidebar */}
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
          <aside className="absolute inset-y-0 left-0 flex w-60 flex-col border-r border-border/60 bg-background animate-in slide-in-from-left duration-300 [animation-timing-function:cubic-bezier(0.32,0.72,0,1)]">
                        <div className="relative flex h-14 items-center justify-between gap-2 border-b border-border/60 px-5">
              <div className="flex items-center gap-2.5">
                <Image src="/images/logo-icone.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                <div className="leading-tight">
                  <p className="text-[15px] font-semibold tracking-tight">Inovak</p>
                  <p className="text-[10px] tracking-wide text-muted-foreground">ERP</p>
                </div>
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
