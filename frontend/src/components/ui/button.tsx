import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium",
    // Transição apenas nas propriedades necessárias — nunca 'all'
    "transition-[transform,background-color,opacity,box-shadow]",
    "duration-[120ms]",
    "[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
    // Feedback de press — responde em pointer-down via active:
    "active:scale-[0.97] active:duration-[80ms]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    // Hover só em dispositivos com ponteiro (não dispara em touch)
    "@media(hover:hover){hover:cursor-pointer}",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary Vivid: gradiente da marca + glow sutil, como na referência.
        default:
          "bg-grad-brand text-white shadow-sm hover:brightness-110 hover:shadow-[0_6px_20px_-6px_hsl(var(--c-amber)/0.55)]",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
