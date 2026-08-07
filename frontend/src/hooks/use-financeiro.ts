"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  atualizarContaPagar,
  atualizarContaReceber,
  cancelarContaPagar,
  cancelarContaReceber,
  criarContaPagar,
  criarContaReceber,
  listarContasPagar,
  listarContasReceber,
  liquidarContaPagar,
  liquidarContaReceber,
  obterResumoFinanceiro,
  removerContaPagar,
  removerContaReceber,
} from "@/lib/api/financeiro";
import { extractErrorMessage } from "@/lib/api/client";
import type { ContaPagarInput, ContaPagarListItem, ContaReceberInput, ContaReceberListItem, StatusConta } from "@/types";

const CONTAS_PAGAR_KEY = "contas-pagar";
const CONTAS_RECEBER_KEY = "contas-receber";
const RESUMO_KEY = "financeiro-resumo";
// Toda mutação em Pagar/Receber muda o resumo financeiro e os cards do
// Dashboard (que reaproveita os mesmos totais) — invalidamos os dois.
const DASHBOARD_KEY = "dashboard-resumo";

type ListParams = { search: string; status: StatusConta | "todos"; page: number; pageSize: number };

export function useResumoFinanceiro() {
  return useQuery({ queryKey: [RESUMO_KEY], queryFn: obterResumoFinanceiro });
}

// --- Contas a Pagar ---------------------------------------------------

export function useContasPagar(params: ListParams) {
  return useQuery({
    queryKey: [CONTAS_PAGAR_KEY, params],
    queryFn: () => listarContasPagar(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateFinanceiro() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [CONTAS_PAGAR_KEY] });
    queryClient.invalidateQueries({ queryKey: [CONTAS_RECEBER_KEY] });
    queryClient.invalidateQueries({ queryKey: [RESUMO_KEY] });
    queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY] });
  };
}

export function useCriarContaPagar() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: (data: ContaPagarInput) => criarContaPagar(data),
    onSuccess: () => {
      invalidate();
      toast.success("Conta a pagar cadastrada com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAtualizarContaPagar() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContaPagarInput }) => atualizarContaPagar(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Conta a pagar atualizada com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRemoverContaPagar() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: (id: string) => removerContaPagar(id),
    onSuccess: () => {
      invalidate();
      toast.success("Conta a pagar removida com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

// --- Contas a Receber ---------------------------------------------------

export function useContasReceber(params: ListParams) {
  return useQuery({
    queryKey: [CONTAS_RECEBER_KEY, params],
    queryFn: () => listarContasReceber(params),
    placeholderData: (prev) => prev,
  });
}

export function useCriarContaReceber() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: (data: ContaReceberInput) => criarContaReceber(data),
    onSuccess: () => {
      invalidate();
      toast.success("Conta a receber cadastrada com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAtualizarContaReceber() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContaReceberInput }) => atualizarContaReceber(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Conta a receber atualizada com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRemoverContaReceber() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: (id: string) => removerContaReceber(id),
    onSuccess: () => {
      invalidate();
      toast.success("Conta a receber removida com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

// --- Ações rápidas (liquidar / cancelar direto na tabela) --------------

function _toContaPagarInput(c: ContaPagarListItem): ContaPagarInput {
  return {
    descricao: c.descricao,
    valor: c.valor,
    data_vencimento: c.data_vencimento,
    fornecedor: c.fornecedor ?? undefined,
    obra_id: c.obra_id ?? undefined,
    categoria: c.categoria ?? undefined,
    data_pagamento: c.data_pagamento ?? undefined,
    status: c.status,
    observacoes: c.observacoes ?? undefined,
  };
}

function _toContaReceberInput(c: ContaReceberListItem): ContaReceberInput {
  return {
    descricao: c.descricao,
    valor: c.valor,
    data_vencimento: c.data_vencimento,
    cliente_id: c.cliente_id ?? undefined,
    obra_id: c.obra_id ?? undefined,
    data_recebimento: c.data_recebimento ?? undefined,
    status: c.status,
    observacoes: c.observacoes ?? undefined,
  };
}

export function useLiquidarContaPagar() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: (conta: ContaPagarListItem) => liquidarContaPagar(conta.id, _toContaPagarInput(conta)),
    onSuccess: () => { invalidate(); toast.success("Conta marcada como paga."); },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useCancelarContaPagar() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: (conta: ContaPagarListItem) => cancelarContaPagar(conta.id, _toContaPagarInput(conta)),
    onSuccess: () => { invalidate(); toast.success("Conta a pagar cancelada."); },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useLiquidarContaReceber() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: (conta: ContaReceberListItem) => liquidarContaReceber(conta.id, _toContaReceberInput(conta)),
    onSuccess: () => { invalidate(); toast.success("Conta marcada como recebida."); },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useCancelarContaReceber() {
  const invalidate = useInvalidateFinanceiro();
  return useMutation({
    mutationFn: (conta: ContaReceberListItem) => cancelarContaReceber(conta.id, _toContaReceberInput(conta)),
    onSuccess: () => { invalidate(); toast.success("Conta a receber cancelada."); },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}
