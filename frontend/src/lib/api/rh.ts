import { apiFetch } from "@/lib/api/client";
import type {
  Funcionario, FuncionarioInput, Alocacao, RegistroPonto, CustoMaoObra, StatusPonto,
} from "@/types";

// Funcionários
export const listarFuncionarios = (params?: { search?: string; apenas_ativos?: boolean; page?: number }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.apenas_ativos === false) q.set("apenas_ativos", "false");
  if (params?.page) q.set("page", String(params.page));
  return apiFetch<{ items: Funcionario[]; total: number; page: number; page_size: number }>(`/rh/funcionarios?${q}`);
};
export const criarFuncionario = (body: FuncionarioInput) =>
  apiFetch<Funcionario>("/rh/funcionarios", { method: "POST", body: JSON.stringify(body) });
export const atualizarFuncionario = (id: string, body: FuncionarioInput) =>
  apiFetch<Funcionario>(`/rh/funcionarios/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const removerFuncionario = (id: string) =>
  apiFetch<void>(`/rh/funcionarios/${id}`, { method: "DELETE" });

// Alocações
export const listarAlocacoes = (params?: { obra_id?: string; funcionario_id?: string; apenas_ativas?: boolean }) => {
  const q = new URLSearchParams();
  if (params?.obra_id) q.set("obra_id", params.obra_id);
  if (params?.funcionario_id) q.set("funcionario_id", params.funcionario_id);
  if (params?.apenas_ativas) q.set("apenas_ativas", "true");
  return apiFetch<Alocacao[]>(`/rh/alocacoes?${q}`);
};
export const criarAlocacao = (body: { funcionario_id: string; obra_id: string; data_inicio: string; data_fim?: string | null; funcao?: string | null; ativa: boolean }) =>
  apiFetch<Alocacao>("/rh/alocacoes", { method: "POST", body: JSON.stringify(body) });
export const removerAlocacao = (id: string) =>
  apiFetch<void>(`/rh/alocacoes/${id}`, { method: "DELETE" });

// Ponto
export const listarPonto = (params: { data_inicio: string; data_fim: string; funcionario_id?: string; obra_id?: string }) => {
  const q = new URLSearchParams({ data_inicio: params.data_inicio, data_fim: params.data_fim });
  if (params.funcionario_id) q.set("funcionario_id", params.funcionario_id);
  if (params.obra_id) q.set("obra_id", params.obra_id);
  return apiFetch<RegistroPonto[]>(`/rh/ponto?${q}`);
};
export const registrarPontoLote = (body: { data: string; obra_id?: string | null; registros: { funcionario_id: string; status: StatusPonto; obra_id?: string | null; horas?: number | null }[] }) =>
  apiFetch<{ registros_salvos: number; data: string }>("/rh/ponto/lote", { method: "POST", body: JSON.stringify(body) });

// Custo de mão de obra
export const custoMaoObra = () => apiFetch<CustoMaoObra[]>("/rh/custo-mao-obra");
