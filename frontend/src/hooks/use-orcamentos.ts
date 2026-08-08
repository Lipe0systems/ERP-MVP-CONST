"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  aprovarOrcamento,
  aprovarOrcamentosEmLote,
  atualizarOrcamento,
  cancelarOrcamento,
  criarOrcamento,
  listarOrcamentos,
  obterOrcamento,
  recusarOrcamento,
  removerOrcamento,
} from "@/lib/api/orcamentos";
import { extractErrorMessage } from "@/lib/api/client";
import type { OrcamentoInput, StatusOrcamento } from "@/types";

const ORCAMENTOS_KEY = "orcamentos";

export function useOrcamentos(params: {
  search: string;
  status: StatusOrcamento | "todos";
  page: number;
  pageSize: number;
}) {
  return useQuery({
    queryKey: [ORCAMENTOS_KEY, params],
    queryFn: () => listarOrcamentos(params),
    placeholderData: (prev) => prev,
  });
}

export function useOrcamento(id: string | null) {
  return useQuery({
    queryKey: [ORCAMENTOS_KEY, id],
    queryFn: () => obterOrcamento(id!),
    enabled: Boolean(id),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [ORCAMENTOS_KEY] });
    // Aprovação/cancelamento afetam estoque e financeiro
    queryClient.invalidateQueries({ queryKey: ["estoque"] });
    queryClient.invalidateQueries({ queryKey: ["financeiro"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCriarOrcamento() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: OrcamentoInput) => criarOrcamento(data),
    onSuccess: () => {
      invalidate();
      toast.success("Orçamento criado com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAtualizarOrcamento() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrcamentoInput }) => atualizarOrcamento(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Orçamento atualizado com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAprovarOrcamento() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => aprovarOrcamento(id),
    onSuccess: () => {
      invalidate();
      toast.success("Orçamento aprovado. Estoque atualizado e cobrança gerada.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRecusarOrcamento() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => recusarOrcamento(id),
    onSuccess: () => {
      invalidate();
      toast.success("Orçamento recusado.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useCancelarOrcamento() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => cancelarOrcamento(id),
    onSuccess: () => {
      invalidate();
      toast.success("Orçamento cancelado. Estoque estornado e cobrança cancelada.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRemoverOrcamento() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => removerOrcamento(id),
    onSuccess: () => {
      invalidate();
      toast.success("Orçamento removido com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAprovarOrcamentosEmLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => aprovarOrcamentosEmLote(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      const { aprovados, falhas } = result;
      if (falhas.length === 0) {
        toast.success(`${aprovados.length} orçamento(s) aprovado(s).`);
      } else {
        toast.warning(`${aprovados.length} aprovado(s), ${falhas.length} falharam.`);
      }
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
