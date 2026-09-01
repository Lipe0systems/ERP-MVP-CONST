"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listarFornecedores, criarFornecedor, atualizarFornecedor, removerFornecedor } from "@/lib/api/fornecedores";
import { extractErrorMessage } from "@/lib/api/client";
import type { Fornecedor, FornecedorInput, PaginatedResponse } from "@/types";

const KEY = "fornecedores";

export function useFornecedores(params: { search: string; page: number; pageSize: number }) {
  return useQuery({ queryKey: [KEY, params], queryFn: () => listarFornecedores(params), placeholderData: (prev) => prev });
}

export function useFornecedoresDropdown() {
  return useQuery({ queryKey: [KEY, "dropdown"], queryFn: () => listarFornecedores({ page: 1, pageSize: 100 }) });
}

export function useCriarFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FornecedorInput) => criarFornecedor(data),
    onSuccess: (criado) => {
      // O POST já devolve o fornecedor criado — insere direto no cache
      // para aparecer na hora, e o invalidate segue em segundo plano
      // reconciliando total/ordenação com o servidor (mesmo padrão já
      // aplicado em Obras e Clientes).
      //
      // setQueriesData atinge tanto a listagem paginada quanto a query
      // do dropdown: ambas usam PaginatedResponse<Fornecedor> (conferido
      // em lib/api/fornecedores.ts), então o formato é compatível e o
      // item novo já fica disponível para seleção imediatamente.
      qc.setQueriesData<PaginatedResponse<Fornecedor>>({ queryKey: [KEY] }, (antigo) => {
        if (!antigo || antigo.page !== 1) return antigo;
        return { ...antigo, items: [criado, ...antigo.items], total: antigo.total + 1 };
      });
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Fornecedor cadastrado.");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useAtualizarFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FornecedorInput }) => atualizarFornecedor(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success("Fornecedor atualizado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useRemoverFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removerFornecedor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success("Fornecedor removido."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
