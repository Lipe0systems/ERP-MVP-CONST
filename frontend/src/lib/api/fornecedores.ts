import { apiFetch } from "@/lib/api/client";
import type { Fornecedor, FornecedorInput, PaginatedResponse } from "@/types";

export function listarFornecedores(params: { search?: string; page: number; pageSize: number }) {
  const q = new URLSearchParams({ page: String(params.page), page_size: String(params.pageSize) });
  if (params.search) q.set("search", params.search);
  return apiFetch<PaginatedResponse<Fornecedor>>(`/fornecedores?${q.toString()}`);
}

export function criarFornecedor(data: FornecedorInput) {
  return apiFetch<Fornecedor>("/fornecedores", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarFornecedor(id: string, data: FornecedorInput) {
  return apiFetch<Fornecedor>(`/fornecedores/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function removerFornecedor(id: string) {
  return apiFetch<void>(`/fornecedores/${id}`, { method: "DELETE" });
}
