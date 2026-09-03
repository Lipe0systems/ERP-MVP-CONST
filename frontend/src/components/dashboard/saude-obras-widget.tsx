"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, HardHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { obterAccessToken } from "@/lib/supabase/session";
import { cn } from "@/lib/utils";

interface SaudeObra {
  obra_id: string;
  obra_nome: string;
  custo_previsto: number;
  custo_realizado: number;
  percentual_consumido: number;
  saude: "dentro_orcamento" | "atencao" | "acima_orcamento";
}

const SAUDE_DOT: Record<SaudeObra["saude"], string> = {
  dentro_orcamento: "bg-green-500",
  atencao: "bg-amber-500",
  acima_orcamento: "bg-red-500",
};

async function fetchSaudeObras(): Promise<SaudeObra[]> {
  // Sessão vem do gerenciador central — sem getSession() próprio.
  const token = await obterAccessToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/saude-obras`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  if (!res.ok) throw new Error("Falha ao carregar saúde das obras");
  return res.json();
}

export function SaudeObrasWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["saude-obras"], queryFn: fetchSaudeObras, retry: 1 });
  const obras = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="icon-vivid kpi-amber h-7 w-7 shrink-0"><HardHat className="h-4 w-4" /></span>
          Saúde das instalações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : obras.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Nenhuma instalação em andamento no momento.
          </div>
        ) : (
          <div className="space-y-2">
            {obras.map((o) => (
              <Link
                key={o.obra_id}
                href={`/obras/${o.obra_id}`}
                className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", SAUDE_DOT[o.saude])} />
                  <span className="truncate">{o.obra_nome}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  {o.saude !== "dentro_orcamento" && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                  <span>{o.percentual_consumido.toFixed(0)}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
