"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listarDocumentos, registrarDocumento, removerDocumento } from "@/lib/api/documentos";
import { removerDocumentoStorage } from "@/lib/supabase/storage-documentos";
import { extractErrorMessage } from "@/lib/api/client";
import type { DocumentoInput } from "@/types";

type Filtros = { cliente_id?: string; obra_id?: string; orcamento_id?: string };

export function useDocumentos(filtros: Filtros) {
  return useQuery({
    queryKey: ["documentos", filtros],
    queryFn: () => listarDocumentos(filtros),
    enabled: Object.values(filtros).some(Boolean),
  });
}

export function useRegistrarDocumento(filtros: Filtros) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentoInput) => registrarDocumento(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentos", filtros] });
      toast.success("Documento salvo com sucesso.");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useRemoverDocumento(filtros: Filtros) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      await removerDocumento(id);
      await removerDocumentoStorage(url); // best-effort
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentos", filtros] });
      toast.success("Documento removido.");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
