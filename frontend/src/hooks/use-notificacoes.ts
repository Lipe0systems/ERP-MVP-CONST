"use client";
import { useQuery } from "@tanstack/react-query";
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

export function useNotificacoes() {
  return useQuery({
    queryKey: ["notificacoes"],
    queryFn: fetchNotificacoes,
    // Atualiza a cada 2 minutos
    refetchInterval: 2 * 60 * 1000,
    // Atualiza quando o usuário volta para a aba
    refetchOnWindowFocus: true,
    staleTime: 60 * 1000,
  });
}
