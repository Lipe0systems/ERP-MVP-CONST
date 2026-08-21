"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import { listarClientes } from "@/lib/api/clientes";
import { listarObras } from "@/lib/api/obras";

/**
 * Prefetch de DADOS ao passar o mouse sobre um item da navegação.
 *
 * O <Link> do Next já faz prefetch da ROTA (o JavaScript da página), mas
 * os dados só começam a ser buscados depois que a página monta. Resultado:
 * o usuário clica, a tela troca, e aí aparece o skeleton. Buscando no
 * hover, os dados normalmente já estão no cache quando ele clica — a tela
 * abre preenchida.
 *
 * Cuidados tomados:
 *  • Só a PRIMEIRA página, com os parâmetros padrão — exatamente o que a
 *    tela pede ao abrir. Prefetch de filtros específicos seria desperdício.
 *  • `staleTime` alinhado ao global (60s): se o dado já está fresco, o
 *    prefetch não dispara request nenhuma.
 *  • Debounce de 120ms: passar o mouse rapidamente por cima do menu
 *    (indo para outro item) não dispara nada.
 *  • Só módulos de listagem pesada. Telas leves não compensam o request
 *    especulativo.
 *  • Isolamento multi-tenant preservado: a requisição usa a mesma sessão
 *    autenticada de sempre; o backend continua filtrando por empresa.
 */

const PREFETCH_DELAY = 120;

// Os parâmetros abaixo replicam EXATAMENTE o estado inicial de cada
// página (PAGE_SIZE = 10, busca vazia, status "todos", página 1). Se não
// baterem, o React Query trata como outra chave e o prefetch é jogado
// fora — conferido contra o código real das páginas.
const PARAMS_CLIENTES = { search: "", page: 1, pageSize: 10 };
const PARAMS_OBRAS = { search: "", status: "todos" as const, page: 1, pageSize: 10 };

const PREFETCHERS: Record<string, { queryKey: unknown[]; queryFn: () => Promise<unknown> }> = {
  "/clientes": {
    queryKey: ["clientes", PARAMS_CLIENTES],
    queryFn: () => listarClientes(PARAMS_CLIENTES),
  },
  "/obras": {
    queryKey: ["obras", PARAMS_OBRAS],
    queryFn: () => listarObras(PARAMS_OBRAS),
  },
};

export function useNavPrefetch() {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetch = useCallback(
    (href: string) => {
      const alvo = PREFETCHERS[href];
      if (!alvo) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: alvo.queryKey,
          queryFn: alvo.queryFn,
          staleTime: 60_000,
        });
      }, PREFETCH_DELAY);
    },
    [queryClient]
  );

  const cancelar = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { prefetch, cancelar };
}
