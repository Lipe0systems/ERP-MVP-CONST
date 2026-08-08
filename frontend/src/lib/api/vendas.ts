import { apiFetch } from "@/lib/api/client";
import type { PaginatedResponse, StatusVenda, Venda, VendaDeOrcamentoInput, VendaListItem } from "@/types";
import { createClient } from "@/lib/supabase/client";

export const listarVendas = (p: { status?: StatusVenda; page: number; pageSize: number }) => {
  const q = new URLSearchParams({ page: String(p.page), page_size: String(p.pageSize) });
  if (p.status) q.set("status", p.status);
  return apiFetch<PaginatedResponse<VendaListItem>>(`/vendas?${q}`);
};

export const criarVendaDeOrcamento = (data: VendaDeOrcamentoInput) =>
  apiFetch<Venda>("/vendas/de-orcamento", { method: "POST", body: JSON.stringify(data) });

export const cancelarVenda = (id: string) =>
  apiFetch<Venda>(`/vendas/${id}/cancelar`, { method: "POST" });

export async function baixarPdfVenda(id: string): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendas/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Erro ao gerar PDF");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "venda.pdf";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
