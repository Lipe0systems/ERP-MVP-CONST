"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRemoverCliente } from "@/hooks/use-clientes";
import type { Cliente } from "@/types";

interface DeleteClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
}

export function DeleteClienteDialog({ open, onOpenChange, cliente }: DeleteClienteDialogProps) {
  const remover = useRemoverCliente();

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    if (!cliente) return;
    try {
      await remover.mutateAsync(cliente.id);
      onOpenChange(false);
    } catch {
      // Erro já foi exibido via toast pelo onError do hook de mutação;
      // aqui só evitamos a rejeição de Promise sem tratamento e mantemos
      // o modal aberto para o usuário tentar novamente.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover cliente</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover <strong>{cliente?.nome}</strong>? Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remover.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={remover.isPending}>
            {remover.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
