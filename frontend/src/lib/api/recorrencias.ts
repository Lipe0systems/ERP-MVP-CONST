import { apiFetch } from "@/lib/api/client";
import type { RecorrenciaCreateInput, RecorrenciaFinanceira, RecorrenciaUpdateInput } from "@/types";

export const listarRecorrencias = (ativo?: boolean) => {
  const q = ativo !== undefined ? `?ativo=${ativo}` : "";
  return apiFetch<RecorrenciaFinanceira[]>(`/recorrencias${q}`);
};

export const criarRecorrencia = (data: RecorrenciaCreateInput) =>
  apiFetch<RecorrenciaFinanceira>("/recorrencias", { method: "POST", body: JSON.stringify(data) });

export const atualizarRecorrencia = (id: string, data: RecorrenciaUpdateInput) =>
  apiFetch<RecorrenciaFinanceira>(`/recorrencias/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const removerRecorrencia = (id: string) =>
  apiFetch<void>(`/recorrencias/${id}`, { method: "DELETE" });

export const gerarPendentes = (mesesAFrente = 1) =>
  apiFetch<{ contas_geradas: number }>(`/recorrencias/gerar-pendentes?meses_a_frente=${mesesAFrente}`, { method: "POST" });
