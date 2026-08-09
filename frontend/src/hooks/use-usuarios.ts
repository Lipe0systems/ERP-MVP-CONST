"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { atualizarPapel, cancelarConvite, criarConvite, listarConvites, listarUsuarios, removerUsuario } from "@/lib/api/usuarios";
import { extractErrorMessage } from "@/lib/api/client";
import type { PapelUsuario } from "@/types";

const KEY = "usuarios";
const KEY_CONV = "convites";

export const useUsuarios = () => useQuery({ queryKey: [KEY], queryFn: listarUsuarios });
export const useConvites = () => useQuery({ queryKey: [KEY_CONV], queryFn: listarConvites });

function useInv() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: [KEY] }); qc.invalidateQueries({ queryKey: [KEY_CONV] }); };
}

export function useCriarConvite() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ email, papel }: { email: string; papel: PapelUsuario }) => criarConvite(email, papel),
    onSuccess: () => { inv(); toast.success("Convite criado! Copie o link e envie ao usuário."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useCancelarConvite() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => cancelarConvite(id),
    onSuccess: () => { inv(); toast.success("Convite cancelado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useAtualizarPapel() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ id, papel }: { id: string; papel: PapelUsuario }) => atualizarPapel(id, papel),
    onSuccess: () => { inv(); toast.success("Papel atualizado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useRemoverUsuario() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => removerUsuario(id),
    onSuccess: () => { inv(); toast.success("Usuário removido."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
