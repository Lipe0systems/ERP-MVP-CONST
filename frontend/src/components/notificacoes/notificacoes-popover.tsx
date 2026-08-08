"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificacoes } from "@/hooks/use-notificacoes";
import { cn } from "@/lib/utils";

export function NotificacoesPopover() {
  const [open, setOpen] = useState(false);
  const { data } = useNotificacoes();

  const notificacoes = data?.notificacoes ?? [];
  const total = data?.total ?? 0;
  const urgentes = data?.urgentes ?? 0;

  return (
    <div className="relative">
      {/* Botão do sino */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notificações"
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white",
              urgentes > 0 ? "bg-destructive" : "bg-amber-500"
            )}
          >
            {total > 9 ? "9+" : total}
          </span>
        )}
      </Button>

      {/* Popover */}
      {open && (
        <>
          {/* Overlay para fechar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border bg-popover shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Notificações</h3>
              {total > 0 && (
                <span className="text-xs text-muted-foreground">{total} alerta{total > 1 ? "s" : ""}</span>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <CheckCheck className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">Tudo em dia!</p>
                  <p className="text-xs text-muted-foreground">Nenhum alerta no momento.</p>
                </div>
              ) : (
                notificacoes.map((n) => (
                  <Link
                    key={n.tipo}
                    href={n.link}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 border-b last:border-0"
                  >
                    <div className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      n.urgente ? "bg-destructive/10" : "bg-amber-500/10"
                    )}>
                      <AlertTriangle className={cn(
                        "h-3.5 w-3.5",
                        n.urgente ? "text-destructive" : "text-amber-600"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{n.titulo}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.descricao}</p>
                    </div>
                    {n.urgente && (
                      <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                        Urgente
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
