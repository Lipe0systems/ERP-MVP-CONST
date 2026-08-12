import { apiFetch } from "@/lib/api/client";

export interface ResumoLixeira {
  total: number;
  dias_expurgo: number;
  modulos: { modulo: string; label: string; quantidade: number }[];
}

export interface ItemLixeira {
  id: string;
  titulo: string;
  deletado_em: string;
  dias_restantes: number;
}

export interface ListaLixeira {
  modulo: string;
  label: string;
  itens: ItemLixeira[];
}

export const resumoLixeira = () => apiFetch<ResumoLixeira>("/lixeira");
export const listarDeletados = (modulo: string) => apiFetch<ListaLixeira>(`/lixeira/${modulo}`);
export const restaurarItem = (modulo: string, id: string) =>
  apiFetch<{ restaurado: boolean }>(`/lixeira/${modulo}/${id}/restaurar`, { method: "POST" });
export const apagarDefinitivo = (modulo: string, id: string) =>
  apiFetch<void>(`/lixeira/${modulo}/${id}`, { method: "DELETE" });
export const expurgarAntigos = () =>
  apiFetch<{ apagados: number }>("/lixeira/expurgar", { method: "POST" });
