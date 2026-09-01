"use client";

import Image from "next/image";
import { Moon, Sun } from "lucide-react";
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

        {/* Painel de destaque — duas fotos diferentes por tema (não é a
            mesma imagem clareada/escurecida): cada uma já traz o texto
            "Soluções inteligentes..." desenhado nela mesma, então não
            sobrepomos texto em HTML por cima de nenhuma das duas. */}
        <div className="relative hidden overflow-hidden md:block md:w-1/2 lg:w-2/5">
          <Image
            src="/images/login-hero-light.png"
            alt="Onseg Gestão — soluções inteligentes para o seu negócio. Mais eficiência, controle e resultados para a sua empresa."
            fill
            priority
            quality={92}
            sizes="(min-width: 1024px) 40vw, 50vw"
            className="object-cover object-left-top dark:hidden"
          />
          <Image
            src="/images/login-hero-dark.png"
            alt="Onseg Gestão — soluções inteligentes para o seu negócio. Mais eficiência, controle e resultados para a sua empresa."
            fill
            priority
            quality={92}
            sizes="(min-width: 1024px) 40vw, 50vw"
            className="hidden object-cover object-left-top dark:block"
          />
        </div>
      </div>
    </div>
  );
}
