import { apiFetch } from "@/lib/api/client";
import type { Documento, DocumentoInput } from "@/types";

export function listarDocumentos(params: { cliente_id?: string; obra_id?: string; orcamento_id?: string }) {
  const q = new URLSearchParams();
  if (params.cliente_id) q.set("cliente_id", params.cliente_id);
  if (params.obra_id) q.set("obra_id", params.obra_id);
  if (params.orcamento_id) q.set("orcamento_id", params.orcamento_id);
  return apiFetch<Documento[]>(`/documentos?${q.toString()}`);
}

export function registrarDocumento(data: DocumentoInput) {
  return apiFetch<Documento>("/documentos", { method: "POST", body: JSON.stringify(data) });
}

export function removerDocumento(id: string) {
  return apiFetch<void>(`/documentos/${id}`, { method: "DELETE" });
}
