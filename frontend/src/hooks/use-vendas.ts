"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { baixarPdfVenda, cancelarVenda, criarVendaDeOrcamento, listarVendas } from "@/lib/api/vendas";
import { extractErrorMessage } from "@/lib/api/client";
import type { StatusVenda, VendaDeOrcamentoInput } from "@/types";

const KEY = "vendas";

export const useVendas = (p: { status?: StatusVenda; page: number; pageSize: number }) =>
  useQuery({ queryKey: [KEY, p], queryFn: () => listarVendas(p), placeholderData: (prev) => prev });

function useInv() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: [KEY] }); qc.invalidateQueries({ queryKey: ["financeiro"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); };
}

export function useCriarVendaDeOrcamento() {
  const inv = useInv();
  return useMutation({
    mutationFn: (data: VendaDeOrcamentoInput) => criarVendaDeOrcamento(data),
    onSuccess: () => { inv(); toast.success("Venda gerada! Parcelas criadas automaticamente."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useCancelarVenda() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => cancelarVenda(id),
    onSuccess: () => { inv(); toast.success("Venda cancelada."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useBaixarPdfVenda() {
  return useMutation({
    mutationFn: (id: string) => baixarPdfVenda(id),
    onError: () => toast.error("Erro ao gerar PDF da venda."),
  });
}
