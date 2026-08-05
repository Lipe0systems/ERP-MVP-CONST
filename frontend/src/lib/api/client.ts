/**
 * Wrapper de fetch para a API do backend: anexa o token de sessão do
 * Supabase automaticamente e centraliza o tratamento de erros HTTP.
 */
import { createClient } from "@/lib/supabase/client";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * Helper compartilhado por todos os hooks de mutação (Clientes, Obras, e os
 * próximos módulos): converte qualquer erro capturado numa mensagem amigável
 * para toast, evitando duplicar essa lógica em cada arquivo de hooks.
 */
export function extractErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Não foi possível concluir a operação.";
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new ApiError("Sessão expirada. Faça login novamente.", 401);
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL não configurada. Verifique o .env.local do frontend.",
      500
    );
  }

  const authHeader = await getAuthHeader();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (body && (body.detail || body.message)) || `Erro inesperado (HTTP ${res.status}).`;
    throw new ApiError(
      typeof message === "string" ? message : "Erro inesperado ao comunicar com o servidor.",
      res.status
    );
  }

  return body as T;
}
