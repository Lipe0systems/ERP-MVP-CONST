import { apiFetch } from "@/lib/api/client";
import type {
  Orcamento,
  OrcamentoInput,
  OrcamentoListItem,
  PaginatedResponse,
  StatusOrcamento,
} from "@/types";

export function listarOrcamentos(params: {
  search?: string;
  status?: StatusOrcamento | "todos";
  page: number;
  pageSize: number;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "todos") query.set("status", params.status);

  return apiFetch<PaginatedResponse<OrcamentoListItem>>(`/orcamentos?${query.toString()}`);
}

export function obterOrcamento(id: string) {
  return apiFetch<Orcamento>(`/orcamentos/${id}`);
}

export function criarOrcamento(data: OrcamentoInput) {
  return apiFetch<Orcamento>("/orcamentos", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarOrcamento(id: string, data: OrcamentoInput) {
  return apiFetch<Orcamento>(`/orcamentos/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function aprovarOrcamento(id: string) {
  return apiFetch<Orcamento>(`/orcamentos/${id}/aprovar`, { method: "POST" });
}

export function recusarOrcamento(id: string) {
  return apiFetch<Orcamento>(`/orcamentos/${id}/recusar`, { method: "POST" });
}

export function cancelarOrcamento(id: string) {
  return apiFetch<Orcamento>(`/orcamentos/${id}/cancelar`, { method: "POST" });
}

export function removerOrcamento(id: string) {
  return apiFetch<void>(`/orcamentos/${id}`, { method: "DELETE" });
}

export async function baixarPdfOrcamento(id: string): Promise<void> {
  // Usa fetch direto (não apiFetch) porque a resposta é um blob, não JSON
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/orcamentos/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Erro ao gerar PDF");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "orcamento.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function aprovarOrcamentosEmLote(orcamentoIds: string[]) {
  return apiFetch<{ aprovados: { id: string; numero: number }[]; falhas: { id: string; erro: string }[] }>(
    "/orcamentos/aprovar-em-lote",
    { method: "POST", body: JSON.stringify({ orcamento_ids: orcamentoIds }) }
  );
}
