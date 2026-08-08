import { apiFetch } from "@/lib/api/client";
import type { Compra, CompraInput, CompraListItem, PaginatedResponse, StatusCompra } from "@/types";

export function listarCompras(params: {
  search?: string;
  status?: StatusCompra | "todos";
  page: number;
  pageSize: number;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "todos") query.set("status", params.status);

  return apiFetch<PaginatedResponse<CompraListItem>>(`/compras?${query.toString()}`);
}

export function criarCompra(data: CompraInput) {
  return apiFetch<Compra>("/compras", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarCompra(id: string, data: CompraInput) {
  return apiFetch<Compra>(`/compras/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function removerCompra(id: string) {
  return apiFetch<void>(`/compras/${id}`, { method: "DELETE" });
}

export function receberCompra(id: string) {
  return apiFetch<import("@/types").Compra>(`/compras/${id}/receber`, { method: "POST" });
}

export function aprovarCompra(id: string) {
  return apiFetch<import("@/types").Compra>(`/compras/${id}/aprovar`, { method: "POST" });
}
