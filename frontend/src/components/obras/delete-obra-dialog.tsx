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
import { useRemoverObra } from "@/hooks/use-obras";
import type { ObraListItem } from "@/types";

interface DeleteObraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra: ObraListItem | null;
}

export function DeleteObraDialog({ open, onOpenChange, obra }: DeleteObraDialogProps) {
  const remover = useRemoverObra();

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    if (!obra) return;
    try {
      await remover.mutateAsync(obra.id);
      onOpenChange(false);
    } catch {
      // Erro já exibido via toast pelo onError do hook de mutação.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover obra</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover <strong>{obra?.nome}</strong>? Esta ação não pode ser
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
