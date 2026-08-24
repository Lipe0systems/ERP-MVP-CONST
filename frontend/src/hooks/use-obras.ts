"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { atualizarObra, criarObra, listarObras, obterObra, obterResultadoObra, removerObra } from "@/lib/api/obras";
import { extractErrorMessage } from "@/lib/api/client";
import type { Obra, ObraInput, ObraStatus, PaginatedResponse } from "@/types";

const OBRAS_KEY = "obras";
// Invalida o resumo do Dashboard também: criar/editar/remover uma obra muda
// os cards de "Obras ativas" / "Obras concluídas".
const DASHBOARD_KEY = "dashboard-resumo";

export function useObras(params: {
  search: string;
  status: ObraStatus | "todos";
  page: number;
  pageSize: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: [OBRAS_KEY, queryParams],
    queryFn: () => listarObras(queryParams),
    placeholderData: (prev) => prev,
    enabled,
  });
}

function useInvalidateObras() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [OBRAS_KEY] });
    queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY] });
  };
}

export function useCriarObra() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateObras();
  return useMutation({
    mutationFn: (data: ObraInput) => criarObra(data),
    onSuccess: (obraCriada) => {
      // PERFORMANCE: o POST já devolve a obra criada (response_model=ObraOut
      // no backend), mas antes essa resposta era descartada e a tela só
      // atualizava depois de invalidate() disparar uma SEGUNDA ida à rede
      // — era isso que fazia o registro demorar ~3s para aparecer.
      //
      // Agora o item entra direto no cache da lista (aparece
      // imediatamente) e o invalidate continua acontecendo em segundo
      // plano, para reconciliar total/ordenação/paginação com o servidor.
      // Ou seja: a UI fica instantânea SEM abrir mão da fonte da verdade.
      queryClient.setQueriesData<PaginatedResponse<Obra>>(
        { queryKey: [OBRAS_KEY] },
        (antigo) => {
          if (!antigo) return antigo;
          // Só insere na primeira página: nas demais, a posição correta
          // depende da ordenação do servidor — inserir no topo ali daria
          // a impressão errada de onde o registro ficou.
          if (antigo.page !== 1) return antigo;
          return {
            ...antigo,
            items: [obraCriada, ...antigo.items],
            total: antigo.total + 1,
          };
        }
      );
      invalidate();
      toast.success("Obra cadastrada com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAtualizarObra() {
  const invalidate = useInvalidateObras();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ObraInput }) => atualizarObra(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Obra atualizada com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRemoverObra() {
  const invalidate = useInvalidateObras();
  return useMutation({
    mutationFn: (id: string) => removerObra(id),
    onSuccess: () => {
      invalidate();
      toast.success("Obra removida com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useObra(id: string | null) {
  return useQuery({
    queryKey: [OBRAS_KEY, id],
    queryFn: () => obterObra(id!),
    enabled: Boolean(id),
  });
}

export function useResultadoObra(id: string | null) {
  return useQuery({
    queryKey: [OBRAS_KEY, id, "resultado"],
    queryFn: () => obterResultadoObra(id!),
    enabled: Boolean(id),
  });
}
