"use client";
import { useQuery } from "@tanstack/react-query";
import { obterWorkspaceObra } from "@/lib/api/workspace-obra";

export const useWorkspaceObra = (obraId: string | null) =>
  useQuery({
    queryKey: ["workspace-obra", obraId],
    queryFn: () => obterWorkspaceObra(obraId!),
    enabled: Boolean(obraId),
  });
