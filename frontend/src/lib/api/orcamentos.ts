import { apiFetch } from "@/lib/api/client";
import type {
  Orcamento,
  OrcamentoInput,
  OrcamentoListItem,
  PaginatedResponse,
  StatusOrcamento,
} from "@/types";

export function listarOrcamentos(params: {
  search?: string;
  status?: StatusOrcamento | "todos";
  page: number;
  pageSize: number;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "todos") query.set("status", params.status);

  return apiFetch<PaginatedResponse<OrcamentoListItem>>(`/orcamentos?${query.toString()}`);
}

export function obterOrcamento(id: string) {
  return apiFetch<Orcamento>(`/orcamentos/${id}`);
}

export function criarOrcamento(data: OrcamentoInput) {
  return apiFetch<Orcamento>("/orcamentos", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarOrcamento(id: string, data: OrcamentoInput) {
  return apiFetch<Orcamento>(`/orcamentos/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function aprovarOrcamento(id: string) {
  return apiFetch<Orcamento>(`/orcamentos/${id}/aprovar`, { method: "POST" });
}

export function recusarOrcamento(id: string) {
  return apiFetch<Orcamento>(`/orcamentos/${id}/recusar`, { method: "POST" });
}

export function cancelarOrcamento(id: string) {
  return apiFetch<Orcamento>(`/orcamentos/${id}/cancelar`, { method: "POST" });
}

export function removerOrcamento(id: string) {
  return apiFetch<void>(`/orcamentos/${id}`, { method: "DELETE" });
}
