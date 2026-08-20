"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /**
             * Antes: `new QueryClient()` sem configuração — o padrão do
             * TanStack é staleTime 0, ou seja, TODO dado é considerado
             * velho imediatamente. Efeito prático: cada vez que um
             * componente montava (inclusive ao voltar para uma página já
             * visitada) e cada vez que a janela recebia foco, a API era
             * chamada de novo. Isso multiplica requisições sem nenhum
             * ganho de frescor real para dados que mudam devagar.
             *
             * 60s é um piso conservador: cobre a navegação típica entre
             * telas (ida e volta ao dashboard, abrir um cadastro e
             * fechar) sem correr risco de mostrar dado velho por muito
             * tempo. Telas que precisam de dado sempre atual podem
             * sobrescrever com staleTime próprio no useQuery.
             */
            staleTime: 60_000,

            /** Mantém o dado em cache por 5min após o componente sair de
             *  tela — voltar para a página anterior fica instantâneo. */
            gcTime: 5 * 60_000,

            /**
             * Desligado de propósito: refetch a cada foco de janela é a
             * maior fonte de requisições invisíveis. Num ERP, alternar
             * entre abas/aplicativos é constante, e cada volta disparava
             * uma rodada inteira de chamadas.
             */
            refetchOnWindowFocus: false,

            /** Não refaz a chamada se o dado ainda está fresco. */
            refetchOnMount: false,

            /** Reconexão de rede continua revalidando — aqui faz sentido. */
            refetchOnReconnect: true,

            /** 1 tentativa extra: erro de rede pontual se recupera, mas
             *  erro real (403/404) não deve travar a tela por 3 tentativas. */
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
