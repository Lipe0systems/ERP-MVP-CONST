import { apiFetch } from "@/lib/api/client";
import type { ContaBancaria, ContaBancariaInput, LancamentoBancario, LancamentoBancarioInput, PaginatedResponse } from "@/types";

export const listarContas = () => apiFetch<ContaBancaria[]>("/banco/contas");
export const criarConta = (data: ContaBancariaInput) => apiFetch<ContaBancaria>("/banco/contas", { method: "POST", body: JSON.stringify(data) });
export const atualizarConta = (id: string, data: ContaBancariaInput) => apiFetch<ContaBancaria>(`/banco/contas/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const removerConta = (id: string) => apiFetch<void>(`/banco/contas/${id}`, { method: "DELETE" });
export const obterSaldoTotal = () => apiFetch<{ total: number; por_conta: Record<string, { nome: string; saldo: number }> }>("/banco/saldo");

export const listarLancamentos = (params: { conta_id?: string; page: number; pageSize: number }) => {
  const q = new URLSearchParams({ page: String(params.page), page_size: String(params.pageSize) });
  if (params.conta_id) q.set("conta_id", params.conta_id);
  return apiFetch<PaginatedResponse<LancamentoBancario>>(`/banco/lancamentos?${q}`);
};
export const criarLancamento = (data: LancamentoBancarioInput) => apiFetch<LancamentoBancario>("/banco/lancamentos", { method: "POST", body: JSON.stringify(data) });
export const removerLancamento = (id: string) => apiFetch<void>(`/banco/lancamentos/${id}`, { method: "DELETE" });
