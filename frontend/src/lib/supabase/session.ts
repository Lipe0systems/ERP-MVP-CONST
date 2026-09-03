/**
 * Gerenciamento central da sessão do navegador.
 *
 * PROBLEMA QUE RESOLVE
 * Antes, cada chamada de API fazia seu próprio `supabase.auth.getSession()`.
 * Numa tela com vários widgets, isso vira uma rajada:
 *
 *     req1 → getSession    req4 → getSession
 *     req2 → getSession    req5 → getSession
 *     req3 → getSession    req6 → getSession
 *
 * Agora existe um único token em memória, compartilhado:
 *
 *     getSession (1x)
 *          ↓
 *     token em memória
 *      ↓    ↓    ↓
 *    req1  req2  req3
 *
 * SEGURANÇA — o que NÃO é feito aqui:
 *  • Não existe um segundo sistema de autenticação: a fonte da verdade
 *    continua sendo o Supabase. Isto é só um cache de leitura.
 *  • O token NUNCA é gravado em localStorage/sessionStorage/cookie por
 *    este módulo. Ele vive apenas numa variável de módulo (memória), que
 *    desaparece ao recarregar a página ou fechar a aba.
 *  • O cache é invalidado imediatamente em SIGNED_OUT e atualizado em
 *    TOKEN_REFRESHED — nunca serve um token de usuário anterior.
 *  • Antes de devolver, valida `expires_at`: token vencido nunca é
 *    reaproveitado, mesmo que ainda esteja em memória.
 */
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

let sessaoEmMemoria: Session | null = null;

// Promise compartilhada: se 6 requests chegarem juntos e a sessão ainda não
// estiver carregada, todos aguardam a MESMA leitura em vez de dispararem 6
// chamadas concorrentes (o "auth stampede").
let leituraEmAndamento: Promise<Session | null> | null = null;

let listenerRegistrado = false;

/** Margem antes do vencimento: evita mandar um token que expira no meio do
 *  caminho até o servidor. */
const MARGEM_EXPIRACAO_S = 60;

function estaValida(sessao: Session | null): sessao is Session {
  if (!sessao?.access_token) return false;
  if (!sessao.expires_at) return true; // sem expiração declarada — deixa o backend decidir
  const agoraS = Math.floor(Date.now() / 1000);
  return sessao.expires_at - MARGEM_EXPIRACAO_S > agoraS;
}

function registrarListener() {
  if (listenerRegistrado) return;
  listenerRegistrado = true;

  createClient().auth.onAuthStateChange((evento, sessao) => {
    // SIGNED_OUT / USER_UPDATED / TOKEN_REFRESHED / SIGNED_IN — em todos os
    // casos a sessão em memória passa a refletir o novo estado real.
    // Em SIGNED_OUT o `sessao` vem null, então o cache é limpo sozinho.
    sessaoEmMemoria = sessao;
    if (evento === "SIGNED_OUT") {
      leituraEmAndamento = null;
    }
  });
}

/**
 * Devolve a sessão atual, reaproveitando a que está em memória sempre que
 * ela ainda for válida. Chamadas simultâneas compartilham a mesma leitura.
 */
export async function obterSessao(): Promise<Session | null> {
  registrarListener();

  if (estaValida(sessaoEmMemoria)) {
    return sessaoEmMemoria;
  }

  // Já existe alguém buscando — entra na carona em vez de abrir outra.
  if (leituraEmAndamento) {
    return leituraEmAndamento;
  }

  leituraEmAndamento = createClient()
    .auth.getSession()
    .then(({ data }) => {
      sessaoEmMemoria = data.session;
      return data.session;
    })
    .finally(() => {
      leituraEmAndamento = null;
    });

  return leituraEmAndamento;
}

/**
 * Token de acesso atual, ou null. Usado pelo apiFetch e por qualquer
 * chamada que precise montar o header Authorization manualmente
 * (downloads de PDF/backup, que não passam pelo apiFetch).
 */
export async function obterAccessToken(): Promise<string | null> {
  const sessao = await obterSessao();
  return sessao?.access_token ?? null;
}

/**
 * Limpa a sessão em memória. Chamado no logout, junto do signOut() — o
 * listener também limparia, mas fazer explicitamente evita qualquer janela
 * entre o clique e o evento chegar.
 */
export function limparSessao() {
  sessaoEmMemoria = null;
  leituraEmAndamento = null;
}
