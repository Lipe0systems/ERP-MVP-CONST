import { apiFetch } from "@/lib/api/client";
import type { Obra, ObraInput, ObraListItem, ObraStatus, PaginatedResponse } from "@/types";

export function listarObras(params: {
  search?: string;
  status?: ObraStatus | "todos";
  page: number;
  pageSize: number;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "todos") query.set("status", params.status);

  return apiFetch<PaginatedResponse<ObraListItem>>(`/obras?${query.toString()}`);
}

export function criarObra(data: ObraInput) {
  return apiFetch<Obra>("/obras", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarObra(id: string, data: ObraInput) {
  return apiFetch<Obra>(`/obras/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removerObra(id: string) {
  return apiFetch<void>(`/obras/${id}`, { method: "DELETE" });
}
