/**
 * Cliente Supabase para uso em componentes do lado do navegador (Client Components).
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// SINGLETON: antes, cada chamada de createClient() construía uma instância
// NOVA do cliente Supabase. Com 13 arquivos chamando isso (alguns dentro de
// funções executadas a cada request), eram dezenas de instâncias criadas
// por sessão — cada uma com seu próprio estado interno de auth e seus
// próprios listeners.
//
// Guardar uma única instância também é pré-requisito para o cache de sessão
// em session.ts: sem singleton, o listener de onAuthStateChange ficaria
// registrado numa instância diferente da que responde getSession().
let cliente: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!cliente) {
    cliente = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return cliente;
}
