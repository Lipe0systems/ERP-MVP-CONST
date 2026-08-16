"use client";

import Image from "next/image";
import { Moon, Sun, Target, Wrench, TrendingUp, Bot } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      {/* Botão de tema — mesmo padrão usado no Header do painel */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Alternar tema"
        className="fixed right-4 top-4 z-10"
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
      </Button>

      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        {/* Painel do formulário */}
        <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 md:w-1/2 lg:w-3/5">
          {children}
        </div>

        {/* Painel de destaque — conteúdo diferente por tema, não é a mesma
            imagem clareada/escurecida: no claro é uma composição de ícones
            (vetorial, sempre nítida em qualquer tela); no escuro é a foto
            noturna já usada antes, que o próprio usuário já validou. */}
        <div className="relative hidden overflow-hidden md:block md:w-1/2 lg:w-2/5">
          {/* ── Tema claro: ilustração vetorial (tint-amber, mesma linguagem do resto do sistema) ── */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-secondary p-10 dark:hidden">
            <div className="grid grid-cols-2 gap-5">
              <div className="tint-amber flex h-20 w-20 items-center justify-center rounded-2xl">
                <TrendingUp className="h-9 w-9" />
              </div>
              <div className="tint-blue flex h-20 w-20 items-center justify-center rounded-2xl">
                <Target className="h-9 w-9" />
              </div>
              <div className="tint-green flex h-20 w-20 items-center justify-center rounded-2xl">
                <Wrench className="h-9 w-9" />
              </div>
              <div className="tint-purple flex h-20 w-20 items-center justify-center rounded-2xl">
                <Bot className="h-9 w-9" />
              </div>
            </div>
            <div className="text-center">
              <p className="t-section">Gestão para empresas</p>
              <p className="mt-1.5 max-w-[240px] text-sm text-muted-foreground">
                Mais eficiência, controle e resultados para o seu negócio.
              </p>
            </div>
          </div>

          {/* ── Tema escuro: foto (já validada, qualidade ajustada anteriormente) ── */}
          <div className="absolute inset-0 hidden dark:block">
            <Image
              src="/images/login-hero.png"
              alt="Inovak Serviços — soluções inteligentes para o seu negócio"
              fill
              priority
              quality={92}
              sizes="(min-width: 1024px) 40vw, 50vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-10 left-8 right-8">
              <p className="text-xl font-semibold leading-tight text-white">
                Soluções inteligentes<br />para o seu negócio
              </p>
              <p className="mt-2 text-sm text-white/70">
                Mais eficiência, controle e resultados para a sua empresa.
              </p>
              <div className="mt-3 h-0.5 w-10 bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
