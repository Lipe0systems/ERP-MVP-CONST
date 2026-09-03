import { obterAccessToken } from "@/lib/supabase/session";
import { apiFetch } from "@/lib/api/client";

export interface ModuloBackup {
  chave: string;
  label: string;
}

export const listarModulosBackup = () => apiFetch<ModuloBackup[]>("/backup/modulos");

/**
 * Dispara o download de uma exportação. Como a resposta é um arquivo binário
 * (xlsx/zip/json), fazemos fetch manual e criamos um link temporário de download.
 */
export async function exportarBackup(
  formato: "excel" | "csv" | "json",
  modulos: string[],
  incluirArquivos = false,
): Promise<void> {
  const token = await obterAccessToken();
  if (!token) throw new Error("Sessão expirada.");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/exportar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ formato, modulos, incluir_arquivos: incluirArquivos }),
  });

  if (!res.ok) throw new Error("Falha ao gerar exportação.");

  await baixarBlob(res);
}

export async function baixarBackupCompleto(): Promise<void> {
  const token = await obterAccessToken();
  if (!token) throw new Error("Sessão expirada.");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/completo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Falha ao gerar backup.");
  await baixarBlob(res);
}

/** Extrai o nome do arquivo do header Content-Disposition e força o download. */
async function baixarBlob(res: Response): Promise<void> {
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "export";

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
