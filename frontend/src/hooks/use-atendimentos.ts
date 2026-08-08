"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { atualizarAtendimento, criarAtendimento, listarAtendimentos, removerAtendimento } from "@/lib/api/atendimentos";
import { extractErrorMessage } from "@/lib/api/client";
import type { AtendimentoInput, StatusAtendimento } from "@/types";

const KEY = "atendimentos";

export function useAtendimentos(p: { cliente_id?: string; obra_id?: string; status?: StatusAtendimento; page: number; pageSize: number }) {
  return useQuery({ queryKey: [KEY, p], queryFn: () => listarAtendimentos(p), placeholderData: (prev) => prev });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: [KEY] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); };
}

export function useCriarAtendimento() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (data: AtendimentoInput) => criarAtendimento(data),
    onSuccess: () => { inv(); toast.success("Atendimento registrado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useAtualizarAtendimento() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AtendimentoInput }) => atualizarAtendimento(id, data),
    onSuccess: () => { inv(); toast.success("Atendimento atualizado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useRemoverAtendimento() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => removerAtendimento(id),
    onSuccess: () => { inv(); toast.success("Atendimento removido."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
