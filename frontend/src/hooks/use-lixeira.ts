"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  resumoLixeira, listarDeletados, restaurarItem, apagarDefinitivo, expurgarAntigos,
} from "@/lib/api/lixeira";
import { extractErrorMessage } from "@/lib/api/client";

export const useResumoLixeira = () =>
  useQuery({ queryKey: ["lixeira-resumo"], queryFn: resumoLixeira });

export const useDeletados = (modulo: string | null) =>
  useQuery({
    queryKey: ["lixeira", modulo],
    queryFn: () => listarDeletados(modulo!),
    enabled: Boolean(modulo),
  });

function useInv() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["lixeira"] });
    qc.invalidateQueries({ queryKey: ["lixeira-resumo"] });
  };
}

export function useRestaurar() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ modulo, id }: { modulo: string; id: string }) => restaurarItem(modulo, id),
    onSuccess: () => { inv(); toast.success("Item restaurado com sucesso."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useApagarDefinitivo() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ modulo, id }: { modulo: string; id: string }) => apagarDefinitivo(modulo, id),
    onSuccess: () => { inv(); toast.success("Item apagado permanentemente."); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useExpurgar() {
  const inv = useInv();
  return useMutation({
    mutationFn: expurgarAntigos,
    onSuccess: (r) => { inv(); toast.success(`${r.apagados} item(ns) antigo(s) removido(s).`); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
