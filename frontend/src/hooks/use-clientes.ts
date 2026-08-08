"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  atualizarCliente,
  buscarCep,
  criarCliente,
  listarClientes,
  obterCliente,
  removerCliente,
} from "@/lib/api/clientes";
import { extractErrorMessage } from "@/lib/api/client";
import type { ClienteV3Input as ClienteInput } from "@/types";

const CLIENTES_KEY = "clientes";

export function useClientes(params: {
  search: string;
  page: number;
  pageSize: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: [CLIENTES_KEY, queryParams],
    queryFn: () => listarClientes(queryParams),
    placeholderData: (prev) => prev, // evita "piscar" a lista ao trocar de página
    enabled,
  });
}

function useInvalidateClientes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [CLIENTES_KEY] });
}

export function useCriarCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: (data: ClienteInput) => criarCliente(data),
    onSuccess: () => {
      invalidate();
      toast.success("Cliente cadastrado com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAtualizarCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteInput }) => atualizarCliente(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Cliente atualizado com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRemoverCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: (id: string) => removerCliente(id),
    onSuccess: () => {
      invalidate();
      toast.success("Cliente removido com sucesso.");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useCliente(id: string | null) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: () => obterCliente(id!),
    enabled: Boolean(id),
  });
}
