"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type Estado = "carregando" | "valido" | "invalido" | "cadastrando" | "sucesso";

const PAPEL_LABEL: Record<string, string> = {
  admin: "Administrador", membro: "Membro", visualizador: "Visualizador",
};

function AceitarConviteConteudo() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [estado, setEstado] = useState<Estado>("carregando");
  const [emailConvite, setEmailConvite] = useState("");
  const [papelConvite, setPapelConvite] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  useEffect(() => {
    if (!token) { setEstado("invalido"); setErroMsg("Token não encontrado."); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/convites/${token}/validar`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valido) {
          setEmailConvite(data.email);
          setPapelConvite(data.papel);
          setEstado("valido");
        } else {
          setErroMsg(data.detail ?? "Convite inválido.");
          setEstado("invalido");
        }
      })
      .catch(() => { setErroMsg("Erro ao validar o convite."); setEstado("invalido"); });
  }, [token]);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setErroMsg("Informe seu nome."); return; }
    if (senha.length < 8) { setErroMsg("A senha deve ter ao menos 8 caracteres."); return; }
    if (senha !== confirmSenha) { setErroMsg("As senhas não coincidem."); return; }
    if (!aceitouTermos) { setErroMsg("Você precisa aceitar os Termos de Uso e a Política de Privacidade."); return; }

    setEstado("cadastrando");
    setErroMsg("");

    try {
      // A conta é criada pelo backend (POST /usuarios/convites/{token}/aceitar),
      // não diretamente no navegador — o backend valida o convite de verdade e
      // grava a empresa em app_metadata (só editável com a service_role key),
      // nunca em user_metadata (que o próprio usuário logado poderia alterar).
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/convites/${token}/aceitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, senha, aceitou_termos: aceitouTermos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Erro ao criar conta.");

      if (data.access_token && data.refresh_token) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      setEstado("sucesso");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setErroMsg(err.message ?? "Erro ao criar conta.");
      setEstado("valido");
    }
  }

  if (estado === "carregando") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (estado === "invalido") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <h1 className="text-xl font-semibold">Convite inválido</h1>
            <p className="text-sm text-muted-foreground">{erroMsg}</p>
            <Button variant="outline" onClick={() => router.push("/login")}>Ir para o login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (estado === "sucesso") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h1 className="text-xl font-semibold">Conta criada!</h1>
            <p className="text-sm text-muted-foreground">Redirecionando para o sistema...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Você foi convidado!</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Crie sua conta para acessar o Construtec como{" "}
            <strong>{PAPEL_LABEL[papelConvite] ?? papelConvite}</strong>.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCadastro} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={emailConvite} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Seu nome *</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha *</Label>
              <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 8 caracteres" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha *</Label>
              <Input id="confirm" type="password" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} />
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span>
                Li e aceito os{" "}
                <a href="/termos" target="_blank" className="text-amber-600 hover:underline">
                  Termos de Uso
                </a>{" "}
                e a{" "}
                <a href="/privacidade" target="_blank" className="text-amber-600 hover:underline">
                  Política de Privacidade e Cookies
                </a>
                .
              </span>
            </label>
            {erroMsg && <p className="text-sm text-destructive">{erroMsg}</p>}
            <Button type="submit" className="w-full" disabled={estado === "cadastrando" || !aceitouTermos}>
              {estado === "cadastrando"
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</>
                : "Criar minha conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Suspense obrigatório no Next.js 15 para páginas que usam useSearchParams()
export default function AceitarConvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AceitarConviteConteudo />
    </Suspense>
  );
}
