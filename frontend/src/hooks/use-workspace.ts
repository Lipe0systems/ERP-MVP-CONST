"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listarProcessos, obterProcesso, iniciarProcesso,
  vincularClienteProcesso, vincularOrcamentoProcesso, avancarParaVenda,
  vincularVendaProcesso, vincularObraProcesso, abandonarProcesso,
} from "@/lib/api/workspace";
import { extractErrorMessage } from "@/lib/api/client";

const KEY = "workspace-processos";

export const useProcessos = (apenasEmAndamento = true) =>
  useQuery({ queryKey: [KEY, apenasEmAndamento], queryFn: () => listarProcessos(apenasEmAndamento) });

export const useProcesso = (id: string | null) =>
  useQuery({ queryKey: [KEY, id], queryFn: () => obterProcesso(id!), enabled: Boolean(id) });

function useInv() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useIniciarProcesso() {
  const inv = useInv();
  return useMutation({
    mutationFn: iniciarProcesso,
    onSuccess: () => inv(),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useVincularCliente() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ processoId, clienteId }: { processoId: string; clienteId: string }) =>
      vincularClienteProcesso(processoId, clienteId),
    onSuccess: () => { inv(); toast.success("Cliente vinculado."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useVincularOrcamento() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ processoId, orcamentoId }: { processoId: string; orcamentoId: string }) =>
      vincularOrcamentoProcesso(processoId, orcamentoId),
    onSuccess: () => { inv(); toast.success("Orçamento vinculado. Proposta pronta."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useAvancarParaVenda() {
  const inv = useInv();
  return useMutation({
    mutationFn: avancarParaVenda,
    onSuccess: () => inv(),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useVincularVenda() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ processoId, vendaId }: { processoId: string; vendaId: string }) =>
      vincularVendaProcesso(processoId, vendaId),
    onSuccess: () => { inv(); toast.success("Venda gerada com sucesso."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useVincularObra() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ processoId, obraId }: { processoId: string; obraId: string }) =>
      vincularObraProcesso(processoId, obraId),
    onSuccess: () => { inv(); toast.success("Processo concluído — obra criada!"); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useAbandonarProcesso() {
  const inv = useInv();
  return useMutation({
    mutationFn: abandonarProcesso,
    onSuccess: () => { inv(); toast.success("Processo removido."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
