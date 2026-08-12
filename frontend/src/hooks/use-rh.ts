"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listarFuncionarios, criarFuncionario, atualizarFuncionario, removerFuncionario,
  listarAlocacoes, criarAlocacao, removerAlocacao,
  listarPonto, registrarPontoLote, custoMaoObra,
} from "@/lib/api/rh";
import { extractErrorMessage } from "@/lib/api/client";
import type { FuncionarioInput } from "@/types";

// ── Funcionários ──────────────────────────────────────────────────────────────
export const useFuncionarios = (params?: { search?: string; apenas_ativos?: boolean; page?: number }) =>
  useQuery({ queryKey: ["funcionarios", params], queryFn: () => listarFuncionarios(params) });

function useInvFunc() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["funcionarios"] });
    qc.invalidateQueries({ queryKey: ["custo-mao-obra"] });
  };
}

export function useCriarFuncionario() {
  const inv = useInvFunc();
  return useMutation({
    mutationFn: (body: FuncionarioInput) => criarFuncionario(body),
    onSuccess: () => { inv(); toast.success("Funcionário cadastrado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
export function useAtualizarFuncionario() {
  const inv = useInvFunc();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: FuncionarioInput }) => atualizarFuncionario(id, body),
    onSuccess: () => { inv(); toast.success("Funcionário atualizado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
export function useRemoverFuncionario() {
  const inv = useInvFunc();
  return useMutation({
    mutationFn: (id: string) => removerFuncionario(id),
    onSuccess: () => { inv(); toast.success("Funcionário desligado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

// ── Alocações ─────────────────────────────────────────────────────────────────
export const useAlocacoes = (params?: { obra_id?: string; funcionario_id?: string; apenas_ativas?: boolean }) =>
  useQuery({ queryKey: ["alocacoes", params], queryFn: () => listarAlocacoes(params) });

export function useCriarAlocacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: criarAlocacao,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alocacoes"] });
      qc.invalidateQueries({ queryKey: ["custo-mao-obra"] });
      toast.success("Funcionário alocado à obra.");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
export function useRemoverAlocacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removerAlocacao(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alocacoes"] });
      qc.invalidateQueries({ queryKey: ["custo-mao-obra"] });
      toast.success("Alocação removida.");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

// ── Ponto ─────────────────────────────────────────────────────────────────────
export const usePonto = (params: { data_inicio: string; data_fim: string; funcionario_id?: string; obra_id?: string }) =>
  useQuery({ queryKey: ["ponto", params], queryFn: () => listarPonto(params) });

export function useRegistrarPontoLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registrarPontoLote,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ponto"] });
      toast.success(`Ponto salvo para ${r.registros_salvos} funcionário(s).`);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

// ── Custo m.o. ──────────────────────────────────────────────────────────────
export const useCustoMaoObra = () =>
  useQuery({ queryKey: ["custo-mao-obra"], queryFn: custoMaoObra });
