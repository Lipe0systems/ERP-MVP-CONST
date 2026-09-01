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

// Timeout padrão para chamadas JSON via apiFetch. Downloads binários
// (PDFs, backup) NÃO passam por aqui — fazem fetch manual próprio em
// lib/api/{relatorios,vendas,backup,orcamentos}.ts, então não são afetados
// por este valor (confirmado no código antes de aplicar este timeout).
const TIMEOUT_PADRAO_MS = 15_000;

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

// Mensagens amigáveis para status que indicam problema de INFRAESTRUTURA
// (não do dado que o usuário enviou) — o corpo dessas respostas geralmente
// nem é JSON (ex.: página de erro HTML do proxy do Render), então sem isso
// a mensagem cairia no genérico "Erro inesperado (HTTP 502)".
const MENSAGENS_INFRA: Record<number, string> = {
  502: "Servidor temporariamente indisponível. Tente novamente em instantes.",
  503: "Servidor temporariamente indisponível. Tente novamente em instantes.",
  504: "O servidor demorou demais para responder. Tente novamente.",
  429: "Muitas requisições em pouco tempo. Aguarde um instante e tente novamente.",
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL não configurada. Verifique o .env.local do frontend.",
      500
    );
  }

  const { timeoutMs = TIMEOUT_PADRAO_MS, ...fetchOptions } = options;
  const authHeader = await getAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      // AbortSignal.timeout: nenhuma requisição fica pendurada indefinidamente
      // se o backend travar ou o Supabase demorar. Sem isso, o usuário via
      // um spinner infinito sem nenhuma pista de que algo deu errado — a
      // sensação de "sistema congelado" que motivou esta auditoria.
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...fetchOptions.headers,
      },
    });
  } catch (err) {
    // Timeout (AbortSignal.timeout dispara TimeoutError/AbortError, não
    // TypeError) é normalizado para TypeError de propósito: o padrão já
    // estabelecido no sistema (ver ConnectionError) usa
    // `err instanceof TypeError` para detectar "problema de conexão, não
    // erro de dado". Sem essa normalização, um timeout escaparia desse
    // tratamento e cairia num erro genérico em vez da tela amigável.
    if (err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError")) {
      throw new TypeError("Tempo de resposta excedido.");
    }
    throw err; // falha de rede "crua" já é TypeError nativamente — repassa como está
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const mensagemAmigavel = MENSAGENS_INFRA[res.status];
    const message =
      mensagemAmigavel ||
      (body && (body.detail || body.message)) ||
      `Erro inesperado (HTTP ${res.status}).`;
    throw new ApiError(
      typeof message === "string" ? message : "Erro inesperado ao comunicar com o servidor.",
      res.status
    );
  }

  return body as T;
}
