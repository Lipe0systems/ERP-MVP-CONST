import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        // Altura maior (h-10) e fundo próprio em vez de transparente: no
        // dark navy, input transparente some contra o card.
        // neu-inset: campo escavado na superfície (ver globals.css)
        "neu-inset flex h-10 w-full rounded-lg px-3 py-2 text-sm",
        "transition-[border-color,box-shadow,background-color] duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
        "placeholder:text-muted-foreground/60",
        // Foco Vivid: anel na cor da marca, mais visível que o anterior
        // foco tratado por .neu-inset:focus-visible
        "focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
