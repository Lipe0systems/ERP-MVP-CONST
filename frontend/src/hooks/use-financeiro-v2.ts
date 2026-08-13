"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pagarConta, receberConta, obterLucro, obterAnaliseCategoria, obterProjecaoSaldo, pagarLote, receberLote, type LiquidarInput } from "@/lib/api/financeiro-v2";
import { extractErrorMessage } from "@/lib/api/client";

function useInvTudo() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["financeiro"] });
    qc.invalidateQueries({ queryKey: ["banco"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["lucro"] });
    qc.invalidateQueries({ queryKey: ["analise-categoria"] });
  };
}

export function usePagarConta() {
  const inv = useInvTudo();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: LiquidarInput }) => pagarConta(id, body),
    onSuccess: () => { inv(); toast.success("Conta paga! Lançamento criado no banco."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useReceberConta() {
  const inv = useInvTudo();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: LiquidarInput }) => receberConta(id, body),
    onSuccess: () => { inv(); toast.success("Conta recebida! Lançamento criado no banco."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export const useLucro = (dias: number) =>
  useQuery({ queryKey: ["lucro", dias], queryFn: () => obterLucro(dias) });

export const useAnaliseCategoria = (dias: number) =>
  useQuery({ queryKey: ["analise-categoria", dias], queryFn: () => obterAnaliseCategoria(dias) });

export const useProjecaoSaldo = (dias: number) =>
  useQuery({ queryKey: ["projecao-saldo", dias], queryFn: () => obterProjecaoSaldo(dias) });

export function usePagarLote() {
  const inv = useInvTudo();
  return useMutation({
    mutationFn: pagarLote,
    onSuccess: (r) => { inv(); toast.success(`${r.pagas?.length ?? 0} conta(s) paga(s) em lote.`); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useReceberLote() {
  const inv = useInvTudo();
  return useMutation({
    mutationFn: receberLote,
    onSuccess: (r) => { inv(); toast.success(`${r.recebidas?.length ?? 0} conta(s) recebida(s) em lote.`); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
