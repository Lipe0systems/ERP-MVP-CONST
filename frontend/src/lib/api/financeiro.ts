import { apiFetch } from "@/lib/api/client";
import type {
  ContaPagar,
  ContaPagarInput,
  ContaPagarListItem,
  ContaReceber,
  ContaReceberInput,
  ContaReceberListItem,
  FinanceiroResumo,
  PaginatedResponse,
  StatusConta,
} from "@/types";

function buildQuery(params: { search?: string; status?: StatusConta | "todos"; page: number; pageSize: number }) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "todos") query.set("status", params.status);
  return query;
}

export function obterResumoFinanceiro() {
  return apiFetch<FinanceiroResumo>("/financeiro/resumo");
}

// --- Contas a Pagar ---------------------------------------------------

export function listarContasPagar(params: {
  search?: string;
  status?: StatusConta | "todos";
  page: number;
  pageSize: number;
}) {
  return apiFetch<PaginatedResponse<ContaPagarListItem>>(`/contas-pagar?${buildQuery(params).toString()}`);
}

export function criarContaPagar(data: ContaPagarInput) {
  return apiFetch<ContaPagar>("/contas-pagar", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarContaPagar(id: string, data: ContaPagarInput) {
  return apiFetch<ContaPagar>(`/contas-pagar/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function removerContaPagar(id: string) {
  return apiFetch<void>(`/contas-pagar/${id}`, { method: "DELETE" });
}

// --- Contas a Receber ---------------------------------------------------

export function listarContasReceber(params: {
  search?: string;
  status?: StatusConta | "todos";
  page: number;
  pageSize: number;
}) {
  return apiFetch<PaginatedResponse<ContaReceberListItem>>(`/contas-receber?${buildQuery(params).toString()}`);
}

export function criarContaReceber(data: ContaReceberInput) {
  return apiFetch<ContaReceber>("/contas-receber", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarContaReceber(id: string, data: ContaReceberInput) {
  return apiFetch<ContaReceber>(`/contas-receber/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function removerContaReceber(id: string) {
  return apiFetch<void>(`/contas-receber/${id}`, { method: "DELETE" });
}
