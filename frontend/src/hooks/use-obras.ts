"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { atualizarObra, criarObra, listarObras, removerObra } from "@/lib/api/obras";
import { extractErrorMessage } from "@/lib/api/client";
import type { ObraInput, ObraStatus } from "@/types";

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
  const invalidate = useInvalidateObras();
  return useMutation({
    mutationFn: (data: ObraInput) => criarObra(data),
    onSuccess: () => {
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
