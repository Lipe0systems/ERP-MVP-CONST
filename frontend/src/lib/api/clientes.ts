import { apiFetch } from "@/lib/api/client";
import type { Cliente, ClienteInput, PaginatedResponse } from "@/types";

export function listarClientes(params: { search?: string; page: number; pageSize: number }) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.search) query.set("search", params.search);

  return apiFetch<PaginatedResponse<Cliente>>(`/clientes?${query.toString()}`);
}

export function criarCliente(data: ClienteInput) {
  return apiFetch<Cliente>("/clientes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarCliente(id: string, data: ClienteInput) {
  return apiFetch<Cliente>(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removerCliente(id: string) {
  return apiFetch<void>(`/clientes/${id}`, { method: "DELETE" });
}

export function buscarCep(cep: string) {
  const digitos = cep.replace(/\D/g, "");
  return apiFetch<import("@/types").CepData>(`/clientes/cep/${digitos}`);
}

export function obterCliente(id: string) {
  return apiFetch<import("@/types").ClienteV3>(`/clientes/${id}`);
}
