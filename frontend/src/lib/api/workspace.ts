import { apiFetch } from "@/lib/api/client";

export type FaseProcesso = "cliente" | "orcamento" | "proposta" | "venda" | "obra" | "concluido";

export interface ProcessoComercial {
  id: string;
  nome: string | null;
  cliente_id: string | null;
  orcamento_id: string | null;
  venda_id: string | null;
  obra_id: string | null;
  fase: FaseProcesso;
  criado_em: string;
  cliente_nome: string | null;
  orcamento_numero: number | null;
  orcamento_status: string | null;
  orcamento_valor_total: number | null;
  venda_numero: number | null;
  obra_nome: string | null;
}

export const listarProcessos = (apenasEmAndamento = true) =>
  apiFetch<ProcessoComercial[]>(`/workspace?apenas_em_andamento=${apenasEmAndamento}`);

export const obterProcesso = (id: string) =>
  apiFetch<ProcessoComercial>(`/workspace/${id}`);

export const iniciarProcesso = (body: { nome?: string; cliente_id?: string }) =>
  apiFetch<ProcessoComercial>("/workspace", { method: "POST", body: JSON.stringify(body) });

export const vincularClienteProcesso = (processoId: string, clienteId: string) =>
  apiFetch<ProcessoComercial>(`/workspace/${processoId}/vincular-cliente?cliente_id=${clienteId}`, { method: "PATCH" });

export const vincularOrcamentoProcesso = (processoId: string, orcamentoId: string) =>
  apiFetch<ProcessoComercial>(`/workspace/${processoId}/vincular-orcamento?orcamento_id=${orcamentoId}`, { method: "PATCH" });

export const avancarParaVenda = (processoId: string) =>
  apiFetch<ProcessoComercial>(`/workspace/${processoId}/avancar-para-venda`, { method: "PATCH" });

export const vincularVendaProcesso = (processoId: string, vendaId: string) =>
  apiFetch<ProcessoComercial>(`/workspace/${processoId}/vincular-venda?venda_id=${vendaId}`, { method: "PATCH" });

export const vincularObraProcesso = (processoId: string, obraId: string) =>
  apiFetch<ProcessoComercial>(`/workspace/${processoId}/vincular-obra?obra_id=${obraId}`, { method: "PATCH" });

export const abandonarProcesso = (processoId: string) =>
  apiFetch<void>(`/workspace/${processoId}`, { method: "DELETE" });
