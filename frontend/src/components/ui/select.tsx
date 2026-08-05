import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select nativo estilizado no padrão dos demais componentes de UI.
 * Optou-se por <select> nativo (em vez de Radix Select) para reduzir
 * complexidade/dependências nesta fase — acessibilidade de teclado e
 * leitor de tela já vem de graça do elemento nativo.
 *
 * `className` controla o contêiner (ex.: largura responsiva "sm:w-56");
 * o <select> interno é sempre "w-full" para preencher esse contêiner —
 * evita ambiguidade de largura ao usar o componente dentro de flex/grid.
 */
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className={cn("relative", className)}>
      <select
        ref={ref}
        className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
);
Select.displayName = "Select";

export { Select };
