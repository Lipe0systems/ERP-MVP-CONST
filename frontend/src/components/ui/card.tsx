import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // O componente Card base agora JÁ NASCE Vivid (card-vivid traz
        // superfície, borda, sombra em camadas e hover consistentes).
        //
        // Motivo: uma varredura mostrou que a maioria das páginas usava
        // <Card> puro — Configurações (12 cards), Financeiro (8),
        // Onboarding (10), Banco (6) estavam com ZERO Vivid, enquanto
        // Dashboard e Obras tinham. Era daí que vinha a sensação de
        // páginas "de produtos diferentes".
        //
        // Aplicar na base em vez de editar 15 páginas garante que
        // qualquer card novo já nasça consistente, e mantém `className`
        // por último — quem precisar sobrescrever algo pontual continua
        // conseguindo, sem quebrar nada existente.
        "card-vivid rounded-xl text-card-foreground",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-sm font-medium text-muted-foreground tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
