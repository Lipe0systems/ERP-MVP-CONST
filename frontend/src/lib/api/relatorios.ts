import { createClient } from "@/lib/supabase/client";

async function baixarPdf(endpoint: string, filename: string): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

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
