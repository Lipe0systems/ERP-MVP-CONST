"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { aprovarCompra, atualizarCompra, criarCompra, listarCompras, receberCompra, removerCompra } from "@/lib/api/compras";
import { extractErrorMessage } from "@/lib/api/client";
import type { CompraInput, StatusCompra } from "@/types";

const COMPRAS_KEY = "compras";

export function useCompras(params: {
  search: string;
  status: StatusCompra | "todos";
  page: number;
  pageSize: number;
}) {
  return useQuery({
    queryKey: [COMPRAS_KEY, params],
    queryFn: () => listarCompras(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateCompras() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [COMPRAS_KEY] });
}

export function useCriarCompra() {
  const invalidate = useInvalidateCompras();
  return useMutation({
    mutationFn: (data: CompraInput) => criarCompra(data),
    onSuccess: () => {
      invalidate();
      toast.success("Compra cadastrada com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAtualizarCompra() {
  const invalidate = useInvalidateCompras();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompraInput }) => atualizarCompra(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Compra atualizada com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRemoverCompra() {
  const invalidate = useInvalidateCompras();
  return useMutation({
    mutationFn: (id: string) => removerCompra(id),
    onSuccess: () => {
      invalidate();
      toast.success("Compra removida com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useReceberCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => receberCompra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Compra recebida! Estoque atualizado automaticamente.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAprovarCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aprovarCompra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Compra aprovada! Conta a pagar gerada automaticamente.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}
