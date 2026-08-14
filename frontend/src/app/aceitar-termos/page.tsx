"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileCheck, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function AceitarTermosPage() {
  const router = useRouter();
  const [aceito, setAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleContinuar() {
    if (!aceito) {
      toast.error("Marque a caixa confirmando que leu e aceita os termos.");
      return;
    }
    setEnviando(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me/aceitar-termos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      });
      if (!res.ok) throw new Error();
      router.replace("/dashboard");
    } catch {
      toast.error("Não foi possível registrar o aceite. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleSair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-6">
      <Card className="w-full max-w-lg card-vivid">
        <CardContent className="space-y-5 p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-grad-brand text-white">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Atualizamos nossos termos</h1>
              <p className="text-sm text-muted-foreground">Precisamos que você confirme o aceite para continuar</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Antes de continuar, leia os documentos abaixo. Eles explicam como tratamos os
            dados inseridos no sistema e as regras de uso da plataforma.
          </p>

          <div className="flex flex-col gap-2 text-sm">
            <Link href="/termos" target="_blank" className="text-amber-600 hover:underline">
              📄 Termos de Uso
            </Link>
            <Link href="/privacidade" target="_blank" className="text-amber-600 hover:underline">
              📄 Política de Privacidade e Cookies
            </Link>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm">
            <input
              type="checkbox"
              checked={aceito}
              onChange={(e) => setAceito(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            Li e aceito os Termos de Uso e a Política de Privacidade e Cookies.
          </label>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={handleSair}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sair
            </Button>
            <Button onClick={handleContinuar} disabled={!aceito || enviando}>
              {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
