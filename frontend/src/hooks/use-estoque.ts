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
import type { ItemEstoqueInput } from "@/types";

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
  const invalidate = useInvalidateEstoque();
  return useMutation({
    mutationFn: (data: ItemEstoqueInput) => criarItemEstoque(data),
    onSuccess: () => {
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
