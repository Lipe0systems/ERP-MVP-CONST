"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { obterMinhaEmpresa, atualizarLogoEmpresa, removerLogoEmpresa } from "@/lib/api/empresa";
import { uploadLogoEmpresa, LogoStorageError } from "@/lib/supabase/storage-logo";

export function LogoEmpresaCard() {
  const qc = useQueryClient();
  const { me } = useCurrentUser();
  const isAdmin = me?.papel === "admin";
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  const { data: empresa, isLoading } = useQuery({
    queryKey: ["empresa-me"],
    queryFn: obterMinhaEmpresa,
  });

  async function handleFile(file: File | null) {
    if (!file || !empresa) return;

    // Preview local imediato (antes do upload terminar) — feedback rápido,
    // como pedido: "criar preview antes/depois do upload".
    const previewLocal = URL.createObjectURL(file);
    setPreview(previewLocal);
    setEnviando(true);

    try {
      const caminho = await uploadLogoEmpresa(empresa.id, file);
      await atualizarLogoEmpresa(caminho);
      await qc.invalidateQueries({ queryKey: ["empresa-me"] });
      toast.success("Logo atualizada com sucesso!");
    } catch (err) {
      if (err instanceof LogoStorageError) toast.error(err.message);
      else toast.error("Não foi possível atualizar a logo. Tente novamente.");
    } finally {
      setEnviando(false);
      URL.revokeObjectURL(previewLocal);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemover() {
    setRemovendo(true);
    try {
      await removerLogoEmpresa();
      await qc.invalidateQueries({ queryKey: ["empresa-me"] });
      toast.success("Logo removida.");
    } catch {
      toast.error("Não foi possível remover a logo.");
    } finally {
      setRemovendo(false);
    }
  }

  const logoAtual = preview ?? empresa?.logo_url ?? null;

  return (
    <div className="card-vivid rounded-2xl p-5">
      <h3 className="mb-1 text-sm font-semibold">Logo da empresa</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Aparece nos PDFs gerados pelo sistema (orçamentos e outros documentos).
      </p>

      <div className="flex items-center gap-4">
        {/* Preview — fallback elegante quando não há logo cadastrada */}
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : logoAtual ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview de upload local (blob:) não é compatível com next/image
            <img src={logoAtual} alt="Logo da empresa" className="h-full w-full object-contain p-2" />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="outline" size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={enviando || isLoading}
            >
              {enviando ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
              {empresa?.logo_url ? "Substituir logo" : "Enviar logo"}
            </Button>
            {empresa?.logo_url && (
              <Button
                variant="ghost" size="sm"
                onClick={handleRemover}
                disabled={removendo || enviando}
                className="text-destructive hover:text-destructive"
              >
                {removendo ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-2 h-3.5 w-3.5" />}
                Remover
              </Button>
            )}
            <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP ou SVG · até 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
