import { apiFetch } from "@/lib/api/client";
import type { Convite, PapelUsuario, Usuario } from "@/types";

export const listarUsuarios = () => apiFetch<Usuario[]>("/usuarios");
export const listarConvites = () => apiFetch<Convite[]>("/usuarios/convites");
export const criarConvite = (email: string, papel: PapelUsuario) =>
  apiFetch<Convite>("/usuarios/convites", { method: "POST", body: JSON.stringify({ email, papel }) });
export const cancelarConvite = (id: string) =>
  apiFetch<void>(`/usuarios/convites/${id}`, { method: "DELETE" });
export const atualizarPapel = (id: string, papel: PapelUsuario) =>
  apiFetch<Usuario>(`/usuarios/${id}/papel`, { method: "PATCH", body: JSON.stringify({ papel }) });
export const removerUsuario = (id: string) =>
  apiFetch<void>(`/usuarios/${id}`, { method: "DELETE" });
