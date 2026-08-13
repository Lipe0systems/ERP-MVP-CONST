"use client";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Notificacao {
  tipo: string;
  titulo: string;
  descricao: string;
  quantidade: number;
  urgente: boolean;
  link: string;
}

interface NotificacoesResponse {
  notificacoes: Notificacao[];
  total: number;
  urgentes: number;
}

async function fetchNotificacoes(): Promise<NotificacoesResponse> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { notificacoes: [], total: 0, urgentes: 0 };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notificacoes`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return { notificacoes: [], total: 0, urgentes: 0 };
  return res.json();
}

/**
 * "Tempo real" via polling curto (20s) — em vez de websocket (frágil no
 * plano gratuito do Render, que hiberna a instância), a cada atualização
 * comparamos com o que já foi visto e disparamos um toast automático só
 * para notificações urgentes que ainda não tinham aparecido.
 */
export function useNotificacoes() {
  const vistosRef = useRef<Set<string>>(new Set());
  const primeiraCargaRef = useRef(true);

  const query = useQuery({
    queryKey: ["notificacoes"],
    queryFn: fetchNotificacoes,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 15 * 1000,
  });

  useEffect(() => {
    if (!query.data) return;

    // Na primeira carga só registra o que já existe, sem disparar toast
    // (evita bombardear o usuário ao abrir o sistema com pendências antigas).
    if (primeiraCargaRef.current) {
      for (const n of query.data.notificacoes) vistosRef.current.add(n.tipo);
      primeiraCargaRef.current = false;
      return;
    }

    for (const n of query.data.notificacoes) {
      if (n.urgente && !vistosRef.current.has(n.tipo)) {
        toast.warning(n.titulo, { description: n.descricao });
      }
      vistosRef.current.add(n.tipo);
    }
  }, [query.data]);

  return query;
}
