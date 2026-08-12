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

export function obterObra(id: string) {
  return apiFetch<Obra>(`/obras/${id}`);
}

export interface ResultadoObra {
  obra_id: string;
  obra_nome: string;
  receita: {
    valor_contratado: number;
    vendas_relacionadas: number;
    recebido: number;
  };
  custos: {
    material: number;
    mao_de_obra: number;
    outros_contas_a_pagar: number;
    total_realizado: number;
    total_previsto: number;
  };
  indicadores: {
    resultado_previsto: number;
    resultado_atual: number;
    margem_prevista_pct: number;
    margem_atual_pct: number;
    percentual_consumido: number;
  };
  saude: "dentro_orcamento" | "atencao" | "acima_orcamento";
}

export function obterResultadoObra(id: string) {
  return apiFetch<ResultadoObra>(`/obras/${id}/resultado`);
}
