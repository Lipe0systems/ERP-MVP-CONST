"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { atualizarConta, criarConta, criarLancamento, listarContas, listarLancamentos, obterSaldoTotal, removerConta, removerLancamento } from "@/lib/api/banco";
import { extractErrorMessage } from "@/lib/api/client";
import type { ContaBancariaInput, LancamentoBancarioInput } from "@/types";

const KEY = "banco";

export const useContas = () => useQuery({ queryKey: [KEY, "contas"], queryFn: listarContas });
export const useSaldoTotal = () => useQuery({ queryKey: [KEY, "saldo"], queryFn: obterSaldoTotal });
export const useLancamentos = (p: { conta_id?: string; page: number; pageSize: number }) =>
  useQuery({ queryKey: [KEY, "lancamentos", p], queryFn: () => listarLancamentos(p), placeholderData: (prev) => prev });

function useInvalidate() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: [KEY] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); };
}

export function useCriarConta() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (data: ContaBancariaInput) => criarConta(data),
    onSuccess: () => { inv(); toast.success("Conta cadastrada."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useAtualizarConta() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContaBancariaInput }) => atualizarConta(id, data),
    onSuccess: () => { inv(); toast.success("Conta atualizada."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useRemoverConta() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => removerConta(id),
    onSuccess: () => { inv(); toast.success("Conta removida."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useCriarLancamento() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (data: LancamentoBancarioInput) => criarLancamento(data),
    onSuccess: () => { inv(); toast.success("Lançamento registrado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useRemoverLancamento() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => removerLancamento(id),
    onSuccess: () => { inv(); toast.success("Lançamento removido."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
