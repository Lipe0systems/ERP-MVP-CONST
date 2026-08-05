"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uploadFotoDiario } from "@/lib/supabase/storage";

interface FotoUploaderProps {
  obraId: string;
  fotos: string[];
  onChange: (fotos: string[]) => void;
  disabled?: boolean;
}

const MAX_FOTOS = 10;

export function FotoUploader({ obraId, fotos, onChange, disabled }: FotoUploaderProps) {
  const [enviando, setEnviando] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const { files } = e.target;
    if (!files || files.length === 0) return;
    const arquivos = Array.from<File>(files);
    e.target.value = ""; // permite selecionar o mesmo arquivo de novo depois

    // Considera tanto as fotos já confirmadas (fotos.length) quanto as que
    // já estão sendo enviadas (enviando) — sem isso, clicar em "Adicionar"
    // de novo antes do primeiro lote terminar deixa passar mais fotos do
    // que a vaga real, podendo estourar o limite quando tudo resolver.
    const vagas = MAX_FOTOS - fotos.length - enviando;
    if (vagas <= 0) {
      toast.error(`No máximo ${MAX_FOTOS} fotos por registro.`);
      return;
    }
    const selecionados = arquivos.slice(0, vagas);
    if (arquivos.length > vagas) {
      toast.error(`Só é possível adicionar mais ${vagas} foto(s) neste registro.`);
    }

    setEnviando((n) => n + selecionados.length);

    const resultados = await Promise.allSettled(
      selecionados.map((file) => uploadFotoDiario(obraId, file))
    );

    const novasUrls: string[] = [];
    for (const resultado of resultados) {
      if (resultado.status === "fulfilled") {
        novasUrls.push(resultado.value);
      } else {
        const mensagem = resultado.reason instanceof Error ? resultado.reason.message : "Falha ao enviar foto.";
        toast.error(mensagem);
      }
    }

    if (novasUrls.length > 0) {
      onChange([...fotos, ...novasUrls]);
    }
    setEnviando((n) => n - selecionados.length);
  }

  function handleRemover(url: string) {
    // Só remove do array local — NÃO apaga do Storage aqui. Se apagássemos
    // na hora e o usuário clicasse em "Cancelar" em seguida, o registro no
    // banco continuaria referenciando uma foto que não existe mais (link
    // quebrado permanente). A exclusão real do Storage só acontece depois
    // que o formulário é salvo com sucesso (ver DiarioFormDialog.onSubmit).
    onChange(fotos.filter((f) => f !== url));
  }

  const podeAdicionar = Boolean(obraId) && !disabled && fotos.length + enviando < MAX_FOTOS;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {fotos.map((url) => (
          <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-md border">
            <Image src={url} alt="Foto do diário de obra" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => handleRemover(url)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remover foto"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {Array.from({ length: enviando }).map((_, i) => (
          <div
            key={`enviando-${i}`}
            className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed"
          >
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!podeAdicionar}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-[10px]">Adicionar</span>
        </button>
      </div>

      {!obraId && <p className="text-xs text-muted-foreground">Selecione uma obra para poder anexar fotos.</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        hidden
        onChange={handleFilesSelected}
      />
    </div>
  );
}
