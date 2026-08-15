import { apiFetch } from "@/lib/api/client";
import type { OrdemServico, OrdemServicoInput, StatusOrdemServico } from "@/types";

interface OrdemServicoListResponse {
  items: OrdemServico[];
  total: number;
  page: number;
  page_size: number;
}

export function listarOrdensServico(params: {
  status?: StatusOrdemServico | "todas";
  page: number;
  pageSize: number;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.status && params.status !== "todas") query.set("status", params.status);

  return apiFetch<OrdemServicoListResponse>(`/ordens-servico?${query.toString()}`);
}

export function obterOrdemServico(id: string) {
  return apiFetch<OrdemServico>(`/ordens-servico/${id}`);
}

export function criarOrdemServico(data: OrdemServicoInput) {
  return apiFetch<OrdemServico>("/ordens-servico", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarOrdemServico(id: string, data: OrdemServicoInput) {
  return apiFetch<OrdemServico>(`/ordens-servico/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function concluirOrdemServico(
  id: string,
  data: { foto_conclusao_url: string; observacoes?: string | null }
) {
  return apiFetch<OrdemServico>(`/ordens-servico/${id}/concluir`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function apagarOrdemServico(id: string) {
  return apiFetch<void>(`/ordens-servico/${id}`, { method: "DELETE" });
}
