"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { aprovarCompra, atualizarCompra, criarCompra, listarCompras, receberCompra, removerCompra } from "@/lib/api/compras";
import { extractErrorMessage } from "@/lib/api/client";
import type { Compra, CompraInput, PaginatedResponse, StatusCompra } from "@/types";

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
  const qc = useQueryClient();
  const invalidate = useInvalidateCompras();
  return useMutation({
    mutationFn: (data: CompraInput) => criarCompra(data),
    onSuccess: (criada) => {
      // Seguro inserir direto: esta mutation invalida APENAS [compras]
      // (conferido) — as invalidações cruzadas com estoque/financeiro
      // vivem em outras mutations do arquivo, que mexem em saldo e conta
      // a pagar. Aqui é só o registro da compra em si.
      qc.setQueriesData<PaginatedResponse<Compra>>({ queryKey: [COMPRAS_KEY] }, (antigo) => {
        if (!antigo || antigo.page !== 1) return antigo;
        return { ...antigo, items: [criada, ...antigo.items], total: antigo.total + 1 };
      });
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
