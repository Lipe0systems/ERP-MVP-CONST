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

/**
 * Modal de confirmação de exclusão genérico, reaproveitado por todos os
 * módulos (Financeiro, Compras, e os próximos) — evita duplicar o mesmo
 * componente em cada pasta; só o título/descrição e a mutação por trás
 * mudam, e ficam a cargo de quem usa o componente.
 */
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
  descricao?: string;
  isPending: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  titulo = "Remover registro",
  descricao,
  isPending,
  onConfirm,
}: DeleteConfirmDialogProps) {
  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Erro já exibido via toast pelo onError do hook de mutação.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover <strong>{descricao}</strong>? Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
