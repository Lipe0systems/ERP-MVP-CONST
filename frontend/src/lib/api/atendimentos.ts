import { apiFetch } from "@/lib/api/client";
import type { AtendimentoInput, AtendimentoListItem, PaginatedResponse, StatusAtendimento } from "@/types";

export function listarAtendimentos(params: {
  cliente_id?: string; obra_id?: string;
  status?: StatusAtendimento; page: number; pageSize: number;
}) {
  const q = new URLSearchParams({ page: String(params.page), page_size: String(params.pageSize) });
  if (params.cliente_id) q.set("cliente_id", params.cliente_id);
  if (params.obra_id) q.set("obra_id", params.obra_id);
  if (params.status) q.set("status", params.status);
  return apiFetch<PaginatedResponse<AtendimentoListItem>>(`/atendimentos?${q}`);
}

export function criarAtendimento(data: AtendimentoInput) {
  return apiFetch<AtendimentoListItem>("/atendimentos", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarAtendimento(id: string, data: AtendimentoInput) {
  return apiFetch<AtendimentoListItem>(`/atendimentos/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function removerAtendimento(id: string) {
  return apiFetch<void>(`/atendimentos/${id}`, { method: "DELETE" });
}
