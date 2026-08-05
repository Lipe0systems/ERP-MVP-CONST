"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  atualizarRegistroDiario,
  criarRegistroDiario,
  listarRegistrosDiario,
  removerRegistroDiario,
} from "@/lib/api/diario-obra";
import { extractErrorMessage } from "@/lib/api/client";
import type { RegistroDiarioInput } from "@/types";

const DIARIO_KEY = "diario-obra";

export function useRegistrosDiario(params: { obraId?: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: [DIARIO_KEY, params],
    queryFn: () => listarRegistrosDiario(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateDiario() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [DIARIO_KEY] });
}

export function useCriarRegistroDiario() {
  const invalidate = useInvalidateDiario();
  return useMutation({
    mutationFn: (data: RegistroDiarioInput) => criarRegistroDiario(data),
    onSuccess: () => {
      invalidate();
      toast.success("Registro de diário cadastrado com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAtualizarRegistroDiario() {
  const invalidate = useInvalidateDiario();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RegistroDiarioInput }) => atualizarRegistroDiario(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Registro de diário atualizado com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRemoverRegistroDiario() {
  const invalidate = useInvalidateDiario();
  return useMutation({
    mutationFn: (id: string) => removerRegistroDiario(id),
    onSuccess: () => {
      invalidate();
      toast.success("Registro de diário removido com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}
