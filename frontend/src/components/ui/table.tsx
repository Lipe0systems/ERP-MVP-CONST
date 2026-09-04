import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    // MOBILE: overflow-auto sozinho rola, mas no celular a experiência
    // depende de dois detalhes a mais:
    //  • -webkit-overflow-scrolling:touch → rolagem com inércia no iOS
    //    (sem isso, o movimento "trava" ao soltar o dedo)
    //  • overscroll-x-contain → impede que rolar a tabela até o fim
    //    acione o "voltar página" por gesto lateral do navegador/app,
    //    que é um jeito clássico de perder o que estava preenchendo.
    // min-w-full garante que a tabela ocupe ao menos a largura visível
    // em vez de encolher demais e ficar ilegível.
    <div
      className="relative w-full overflow-x-auto overscroll-x-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <table ref={ref} className={cn("w-full min-w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border/60",
        // Transição apenas em background-color — nunca 'all'
        "transition-colors duration-100 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
        "hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        // Cabeçalho com mais presença: maiúsculas discretas e peso maior,
        // separando visualmente do corpo da tabela (padrão da referência).
        "h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("px-4 py-3.5 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
