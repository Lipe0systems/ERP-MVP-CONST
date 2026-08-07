"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listarFornecedores, criarFornecedor, atualizarFornecedor, removerFornecedor } from "@/lib/api/fornecedores";
import { extractErrorMessage } from "@/lib/api/client";
import type { FornecedorInput } from "@/types";

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success("Fornecedor cadastrado."); },
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
