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
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }

      // Bloqueia a entrada de quem nunca aceitou os Termos de Uso/Política
      // de Privacidade (ex.: contas criadas antes de este aceite existir).
      // Quem cria conta agora (onboarding/convite) já aceita no próprio
      // formulário de cadastro, então normalmente não passa por aqui.
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me/termos`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (res.ok) {
          const status = await res.json();
          if (status.precisa_aceitar) {
            router.replace("/aceitar-termos");
            return;
          }
        }
      } catch {
        // Falha ao checar não deve travar o acesso — segue normalmente.
      }

      setSessaoVerificada(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  if (!sessaoVerificada) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/30">
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
