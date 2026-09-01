"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  atualizarItemEstoque,
  criarItemEstoque,
  listarEstoque,
  removerItemEstoque,
} from "@/lib/api/estoque";
import { extractErrorMessage } from "@/lib/api/client";
import type { ItemEstoque, ItemEstoqueInput, PaginatedResponse } from "@/types";

const ESTOQUE_KEY = "estoque";

export function useEstoque(params: { search: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: [ESTOQUE_KEY, params],
    queryFn: () => listarEstoque(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateEstoque() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [ESTOQUE_KEY] });
}

export function useCriarItemEstoque() {
  const qc = useQueryClient();
  const invalidate = useInvalidateEstoque();
  return useMutation({
    mutationFn: (data: ItemEstoqueInput) => criarItemEstoque(data),
    onSuccess: (criado) => {
      // Item novo entra direto no cache (aparece na hora); o invalidate
      // continua reconciliando com o servidor em segundo plano.
      qc.setQueriesData<PaginatedResponse<ItemEstoque>>({ queryKey: [ESTOQUE_KEY] }, (antigo) => {
        if (!antigo || antigo.page !== 1) return antigo;
        return { ...antigo, items: [criado, ...antigo.items], total: antigo.total + 1 };
      });
      invalidate();
      toast.success("Item de estoque cadastrado com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAtualizarItemEstoque() {
  const invalidate = useInvalidateEstoque();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemEstoqueInput }) => atualizarItemEstoque(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Item de estoque atualizado com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRemoverItemEstoque() {
  const invalidate = useInvalidateEstoque();
  return useMutation({
    mutationFn: (id: string) => removerItemEstoque(id),
    onSuccess: () => {
      invalidate();
      toast.success("Item de estoque removido com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}
