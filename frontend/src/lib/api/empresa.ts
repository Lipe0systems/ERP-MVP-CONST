import { apiFetch } from "@/lib/api/client";

export interface EmpresaMe {
  id: string;
  nome: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  logo_url: string | null;
}

export const obterMinhaEmpresa = () => apiFetch<EmpresaMe>("/empresa/me");

export const atualizarLogoEmpresa = (logo_path: string) =>
  apiFetch<EmpresaMe>("/empresa/me/logo", {
    method: "PUT",
    body: JSON.stringify({ logo_path }),
  });

export const removerLogoEmpresa = () =>
  apiFetch<EmpresaMe>("/empresa/me/logo", { method: "DELETE" });
