"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/page-transition";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessaoVerificada, setSessaoVerificada] = useState(false);

  // Proteção de rota no lado do cliente: sem isso, digitar a URL do
  // dashboard diretamente (sem estar logado) renderizaria a casca da
  // tela antes de qualquer chamada de API falhar. O backend já bloqueia
  // corretamente qualquer dado real (nenhuma informação vaza sem isto),
  // mas essa checagem evita a experiência ruim de ver a tela "vazia" e
  // manda direto para o login quando não há sessão.
  useEffect(() => {
    let ativo = true;
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      // Bloqueia a entrada de quem nunca aceitou os Termos de Uso/Política
      // de Privacidade (ex.: contas criadas antes de este aceite existir).
      // Quem cria conta agora (onboarding/convite) já aceita no próprio
      // formulário de cadastro, então normalmente não passa por aqui.
      //
      // PERFORMANCE: esta checagem roda UMA VEZ POR SESSÃO, não a cada
      // navegação. Antes, este layout envolve todas as telas do sistema,
      // então trocar de página disparava getSession() + este fetch em
      // sequência — e a interface inteira (sidebar, header, conteúdo)
      // ficava bloqueada esperando as duas terminarem, toda vez.
      //
      // Guardar em sessionStorage é seguro aqui porque:
      //  • O aceite não muda no meio da sessão (só é registrado uma vez,
      //    e quem não aceitou é redirecionado antes de entrar).
      //  • sessionStorage é limpo ao fechar a aba, e a chave inclui o id
      //    do usuário — trocar de conta na mesma aba não reaproveita a
      //    verificação de outra pessoa.
      //  • É apenas UX: o backend continua bloqueando de verdade quem não
      //    tem permissão. Nada de segurança depende deste atalho.
      const chaveAceite = `termos-ok:${data.session.user.id}`;
      const jaVerificado = sessionStorage.getItem(chaveAceite) === "1";

      if (!jaVerificado) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me/termos`, {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          });
          if (!ativo) return;
          if (res.ok) {
            const status = await res.json();
            if (status.precisa_aceitar) {
              router.replace("/aceitar-termos");
              return;
            }
            sessionStorage.setItem(chaveAceite, "1");
          }
        } catch {
          // Falha ao checar não deve travar o acesso — segue normalmente.
        }
      }

      if (ativo) setSessaoVerificada(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // Logout/expiração: limpa a marca de verificação para que o
        // próximo login refaça a checagem do zero.
        try { sessionStorage.clear(); } catch { /* modo privado pode bloquear */ }
        router.replace("/login");
      }
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (!sessaoVerificada) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--content-backdrop))]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--content-backdrop))]">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-5 sm:p-7">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
