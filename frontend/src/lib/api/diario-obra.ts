import { apiFetch } from "@/lib/api/client";
import type { PaginatedResponse, RegistroDiario, RegistroDiarioInput, RegistroDiarioListItem } from "@/types";

export function listarRegistrosDiario(params: { obraId?: string; page: number; pageSize: number }) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.obraId) query.set("obra_id", params.obraId);

  return apiFetch<PaginatedResponse<RegistroDiarioListItem>>(`/diario-obra?${query.toString()}`);
}

export function criarRegistroDiario(data: RegistroDiarioInput) {
  return apiFetch<RegistroDiario>("/diario-obra", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarRegistroDiario(id: string, data: RegistroDiarioInput) {
  return apiFetch<RegistroDiario>(`/diario-obra/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function removerRegistroDiario(id: string) {
  return apiFetch<void>(`/diario-obra/${id}`, { method: "DELETE" });
}
