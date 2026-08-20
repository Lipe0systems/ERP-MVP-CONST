"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

type Cor = "brand" | "blue" | "green" | "purple" | "cyan" | "red";

// Mesmo mapa de gradiente + anel do PageHeader — reaproveitado de propósito
// (não recriado), pra essa tela usar exatamente a mesma linguagem visual
// do resto do sistema, em vez de inventar um novo vocabulário de cor.
const GRAD: Record<Cor, string> = {
  brand: "bg-gradient-to-br from-amber-500 to-orange-600",
  blue: "bg-gradient-to-br from-blue-500 to-indigo-600",
  green: "bg-gradient-to-br from-green-500 to-emerald-600",
  purple: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
  cyan: "bg-gradient-to-br from-cyan-500 to-blue-600",
  red: "bg-gradient-to-br from-red-500 to-rose-600",
};
const RING: Record<Cor, string> = {
  brand: "ring-amber-500/20", blue: "ring-blue-500/20", green: "ring-green-500/20",
  purple: "ring-purple-500/20", cyan: "ring-cyan-500/20", red: "ring-red-500/20",
};

interface AcaoErro {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface ErrorPageProps {
  /** Código/rótulo curto (ex.: "404", "403"). Opcional — nem todo erro tem um número claro (conexão, inesperado). */
  status?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  cor?: Cor;
  primaryAction: AcaoErro;
  secondaryAction?: AcaoErro;
}

/**
 * Base compartilhada de todas as telas de erro do sistema (404, 403, 500,
 * conexão, inesperado). Centralizar aqui evita duplicar a mesma composição
 * 5 vezes — cada tela específica só passa título/descrição/ícone/ações.
 *
 * Deliberadamente NÃO usa PageHeader, Sidebar ou Header do painel: essas
 * telas podem aparecer quando o próprio sistema logado falhou (ex.: erro
 * 500 dentro do dashboard), então precisam ser autossuficientes — sem
 * dependência de dado nenhum vindo da API.
 */
export function ErrorPage({ status, title, description, icon: Icon, cor = "brand", primaryAction, secondaryAction }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <Image
        src="/images/logo-completa.png"
        alt="Inovak Serviços"
        width={779}
        height={227}
        className="mb-10 h-9 w-auto object-contain"
        priority
      />

      <div className={cn(
        "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md ring-4",
        GRAD[cor], RING[cor]
      )}>
        <Icon className="h-7 w-7" />
      </div>

      {status && (
        <p className="text-sm font-semibold tracking-wide text-muted-foreground">{status}</p>
      )}
      <h1 className="t-page-title mt-1">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        {secondaryAction && (
          secondaryAction.href ? (
            <Link href={secondaryAction.href} className={cn(buttonVariants({ variant: "outline" }))}>
              {secondaryAction.label}
            </Link>
          ) : (
            <Button variant="outline" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
          )
        )}
        {primaryAction.href ? (
          <Link href={primaryAction.href} className={cn(buttonVariants({ variant: "default" }))}>
            {primaryAction.label}
          </Link>
        ) : (
          <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
        )}
      </div>

      <p className="mt-14 text-xs text-muted-foreground/60">Inovak Serviços</p>
    </div>
  );
}
