import { apiFetch } from "@/lib/api/client";

export interface LiquidarInput {
  conta_bancaria_id: string;
  data?: string;
  comprovante_url?: string | null;
}

export const pagarConta = (id: string, body: LiquidarInput) =>
  apiFetch(`/contas-pagar/${id}/pagar`, { method: "POST", body: JSON.stringify(body) });

export const receberConta = (id: string, body: LiquidarInput) =>
  apiFetch(`/contas-receber/${id}/receber`, { method: "POST", body: JSON.stringify(body) });

export interface LucroResumo {
  dias: number;
  receita_realizada: number;
  despesa_realizada: number;
  lucro: number;
  periodo_anterior: { receita_realizada: number; despesa_realizada: number; lucro: number };
  variacao_pct: number | null;
}

export const obterLucro = (dias: number) =>
  apiFetch<LucroResumo>(`/financeiro/lucro?dias=${dias}`);

export interface AnaliseCategoria {
  dias: number;
  despesas: { categoria: string; total: number }[];
  receitas: { categoria: string; total: number }[];
}

export const obterAnaliseCategoria = (dias: number) =>
  apiFetch<AnaliseCategoria>(`/financeiro/analise-categoria?dias=${dias}`);

export interface ProjecaoSaldo {
  saldo_atual: number;
  saldo_final_projetado: number;
  dias: number;
  pontos: { data: string; saldo_projetado: number }[];
}

export const obterProjecaoSaldo = (dias: number) =>
  apiFetch<ProjecaoSaldo>(`/financeiro/projecao-saldo?dias=${dias}`);

export interface LiquidarLoteInput {
  conta_ids: string[];
  conta_bancaria_id: string;
  data?: string;
}

export interface LoteResultado {
  pagas?: string[];
  recebidas?: string[];
  ja_liquidadas: string[];
  nao_encontradas: string[];
}

export const pagarLote = (body: LiquidarLoteInput) =>
  apiFetch<LoteResultado>("/contas-pagar/pagar-lote", { method: "POST", body: JSON.stringify(body) });

export const receberLote = (body: LiquidarLoteInput) =>
  apiFetch<LoteResultado>("/contas-receber/receber-lote", { method: "POST", body: JSON.stringify(body) });
