import { apiFetch } from "@/lib/api/client";
import type { ItemEstoque, ItemEstoqueInput, PaginatedResponse } from "@/types";

export function listarEstoque(params: { search?: string; page: number; pageSize: number }) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.search) query.set("search", params.search);

  return apiFetch<PaginatedResponse<ItemEstoque>>(`/estoque?${query.toString()}`);
}

export function criarItemEstoque(data: ItemEstoqueInput) {
  return apiFetch<ItemEstoque>("/estoque", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarItemEstoque(id: string, data: ItemEstoqueInput) {
  return apiFetch<ItemEstoque>(`/estoque/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function removerItemEstoque(id: string) {
  return apiFetch<void>(`/estoque/${id}`, { method: "DELETE" });
}
