"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { atualizarRecorrencia, criarRecorrencia, gerarPendentes, listarRecorrencias, removerRecorrencia } from "@/lib/api/recorrencias";
import { extractErrorMessage } from "@/lib/api/client";
import type { RecorrenciaCreateInput, RecorrenciaUpdateInput } from "@/types";

const KEY = "recorrencias";

export const useRecorrencias = (ativo?: boolean) =>
  useQuery({ queryKey: [KEY, ativo], queryFn: () => listarRecorrencias(ativo) });

function useInv() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: [KEY] }); qc.invalidateQueries({ queryKey: ["financeiro"] }); };
}

export function useCriarRecorrencia() {
  const inv = useInv();
  return useMutation({
    mutationFn: (data: RecorrenciaCreateInput) => criarRecorrencia(data),
    onSuccess: () => { inv(); toast.success("Recorrência criada."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useAtualizarRecorrencia() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecorrenciaUpdateInput }) => atualizarRecorrencia(id, data),
    onSuccess: () => { inv(); toast.success("Recorrência atualizada."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useRemoverRecorrencia() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => removerRecorrencia(id),
    onSuccess: () => { inv(); toast.success("Recorrência removida."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useGerarPendentes() {
  const inv = useInv();
  return useMutation({
    mutationFn: (meses: number) => gerarPendentes(meses),
    onSuccess: (r) => { inv(); toast.success(`${r.contas_geradas} conta(s) gerada(s).`); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
