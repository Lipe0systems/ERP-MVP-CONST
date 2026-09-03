import { obterAccessToken } from "@/lib/supabase/session";

async function baixarPdf(endpoint: string, filename: string): Promise<void> {
  // Sessão compartilhada (ver lib/supabase/session.ts) — sem getSession()
  // próprio a cada download.
  const token = await obterAccessToken();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Erro ao gerar relatório");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function baixarRelatorioFinanceiro(status?: string) {
  const query = status ? `?status=${status}` : "";
  return baixarPdf(`/relatorios/financeiro/pdf${query}`, "relatorio_financeiro.pdf");
}

export function baixarRelatorioOrcamentos(status?: string) {
  const query = status ? `?status=${status}` : "";
  return baixarPdf(`/relatorios/orcamentos/pdf${query}`, "relatorio_orcamentos.pdf");
}

export function baixarRelatorioCompras(status?: string) {
  const query = status ? `?status=${status}` : "";
  return baixarPdf(`/relatorios/compras/pdf${query}`, "relatorio_compras.pdf");
}

export function baixarRelatorioDiario(obraId?: string) {
  const query = obraId ? `?obra_id=${obraId}` : "";
  return baixarPdf(`/relatorios/diario-obra/pdf${query}`, "diario_obra.pdf");
}
