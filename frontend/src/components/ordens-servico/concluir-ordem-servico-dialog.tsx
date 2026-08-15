"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConcluirOrdemServico } from "@/hooks/use-ordens-servico";
import { uploadDocumento, DocumentoStorageError } from "@/lib/supabase/storage-documentos";
import type { OrdemServico } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordem: OrdemServico | null;
}

export function ConcluirOrdemServicoDialog({ open, onOpenChange, ordem }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);

  const concluir = useConcluirOrdemServico();

  function handleFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ordem) return;
    if (!file) {
      toast.error("A foto do serviço concluído é obrigatória.");
      return;
    }

    setEnviando(true);
    try {
      // Reaproveita o mesmo upload de Documentos (mesmo bucket, mesma
      // validação de tipo/tamanho) — só muda a "pasta" (entidade) usada.
      const { url } = await uploadDocumento("ordens-servico", ordem.id, file);
      await concluir.mutateAsync({
        id: ordem.id,
        foto_conclusao_url: url,
        observacoes: observacoes || null,
      });
      setFile(null); setPreview(null); setObservacoes("");
      onOpenChange(false);
    } catch (err) {
      if (err instanceof DocumentoStorageError) toast.error(err.message);
      else toast.error("Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Concluir serviço</DialogTitle>
        </DialogHeader>
        {ordem && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              OS #{ordem.numero.toString().padStart(4, "0")} — {ordem.titulo}
            </p>

            <div className="space-y-2">
              <Label htmlFor="foto">Foto do serviço concluído *</Label>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Prévia" className="h-40 w-full rounded-lg object-cover" />
                  <Button
                    type="button" variant="outline" size="sm" className="mt-2 w-full"
                    onClick={() => handleFile(null)}
                  >
                    Trocar foto
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="foto"
                  className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground hover:bg-muted/50"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-sm">Tirar ou escolher foto</span>
                </label>
              )}
              <input
                id="foto" type="file" accept="image/*" capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações (opcional)</Label>
              <Textarea
                id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                rows={2} placeholder="Algo que o cliente ou o admin precisa saber?"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando || !file}>
                {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Marcar como concluída
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
