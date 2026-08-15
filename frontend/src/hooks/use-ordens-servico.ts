"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  apagarOrdemServico,
  atualizarOrdemServico,
  concluirOrdemServico,
  criarOrdemServico,
  listarOrdensServico,
  obterOrdemServico,
} from "@/lib/api/ordens-servico";
import { extractErrorMessage } from "@/lib/api/client";
import type { OrdemServicoInput, StatusOrdemServico } from "@/types";

const OS_KEY = "ordens-servico";

export function useOrdensServico(params: { status: StatusOrdemServico | "todas"; page: number; pageSize: number }) {
  return useQuery({
    queryKey: [OS_KEY, params],
    queryFn: () => listarOrdensServico(params),
  });
}

export function useOrdemServico(id: string | undefined) {
  return useQuery({
    queryKey: [OS_KEY, id],
    queryFn: () => obterOrdemServico(id!),
    enabled: !!id,
  });
}

export function useCriarOrdemServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OrdemServicoInput) => criarOrdemServico(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [OS_KEY] });
      toast.success("Ordem de serviço criada.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useAtualizarOrdemServico(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OrdemServicoInput) => atualizarOrdemServico(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [OS_KEY] });
      toast.success("Ordem de serviço atualizada.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useConcluirOrdemServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; foto_conclusao_url: string; observacoes?: string | null }) =>
      concluirOrdemServico(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [OS_KEY] });
      toast.success("Ordem de serviço marcada como concluída!");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useApagarOrdemServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apagarOrdemServico(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [OS_KEY] });
      toast.success("Ordem de serviço removida.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
