"use client";

import { useRef, useState } from "react";
import {
  FileText, FileImage, FileSpreadsheet, Loader2,
  Plus, Trash2, Download, File,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useDocumentos, useRegistrarDocumento, useRemoverDocumento } from "@/hooks/use-documentos";
import { uploadDocumento, validarArquivoDocumento } from "@/lib/supabase/storage-documentos";
import type { Documento } from "@/types";

interface Props {
  clienteId?: string;
  obraId?: string;
  orcamentoId?: string;
}

function iconeArquivo(tipo: string) {
  if (tipo.startsWith("image/")) return FileImage;
  if (tipo.includes("sheet") || tipo.includes("excel")) return FileSpreadsheet;
  if (tipo.includes("pdf") || tipo.includes("word")) return FileText;
  return File;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentosPanel({ clienteId, obraId, orcamentoId }: Props) {
  const filtros = { cliente_id: clienteId, obra_id: obraId, orcamento_id: orcamentoId };
  const entidade = clienteId ? "clientes" : obraId ? "obras" : "orcamentos";
  const entidadeId = (clienteId ?? obraId ?? orcamentoId)!;

  const { data: docs = [], isLoading } = useDocumentos(filtros);
  const registrar = useRegistrarDocumento(filtros);
  const remover = useRemoverDocumento(filtros);

  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [nomeCustom, setNomeCustom] = useState("");
  const [descricao, setDescricao] = useState("");
  const [removendo, setRemovendo] = useState<Documento | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const erro = validarArquivoDocumento(file);
    if (erro) { toast.error(erro); return; }
    setArquivoSelecionado(file);
    setNomeCustom(file.name.replace(/\.[^.]+$/, "")); // nome sem extensão
    setMostrarForm(true);
  }

  async function handleUpload() {
    if (!arquivoSelecionado) return;
    setEnviando(true);
    try {
      const { url, nome: arqNome, tipo, tamanho } = await uploadDocumento(entidade, entidadeId, arquivoSelecionado);
      await registrar.mutateAsync({
        nome: nomeCustom.trim() || arqNome,
        arquivo_url: url,
        arquivo_nome: arqNome,
        arquivo_tipo: tipo,
        arquivo_tamanho: tamanho,
        cliente_id: clienteId ?? null,
        obra_id: obraId ?? null,
        orcamento_id: orcamentoId ?? null,
        descricao: descricao.trim() || null,
      });
      setMostrarForm(false);
      setArquivoSelecionado(null);
      setNomeCustom("");
      setDescricao("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar o arquivo.");
    } finally {
      setEnviando(false);
    }
  }

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando documentos...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Input oculto de arquivo */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        onChange={handleFileChange}
      />

      {/* Form de upload */}
      {mostrarForm && arquivoSelecionado && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Arquivo: <strong>{arquivoSelecionado.name}</strong> ({formatarTamanho(arquivoSelecionado.size)})
          </p>
          <div className="space-y-1">
            <Label htmlFor="doc-nome" className="text-xs">Nome de exibição</Label>
            <Input id="doc-nome" value={nomeCustom} onChange={(e) => setNomeCustom(e.target.value)} placeholder="Ex.: Contrato assinado" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-desc" className="text-xs">Descrição (opcional)</Label>
            <Input id="doc-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Versão final aprovada em..." />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpload} disabled={enviando}>
              {enviando ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Enviando...</> : "Salvar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setMostrarForm(false); setArquivoSelecionado(null); if (inputRef.current) inputRef.current.value = ""; }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      {docs.length === 0 && !mostrarForm ? (
        <EmptyState
          icon={FileText}
          title="Nenhum documento"
          description="Anexe contratos, ARTs, imagens ou planilhas."
          actionLabel="Adicionar documento"
          onAction={() => inputRef.current?.click()}
        />
      ) : (
        <>
          {docs.map((doc) => {
            const Icone = iconeArquivo(doc.arquivo_tipo);
            return (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <Icone className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.arquivo_nome} · {formatarTamanho(doc.arquivo_tamanho)}
                    {doc.descricao && ` · ${doc.descricao}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <a href={doc.arquivo_url} target="_blank" rel="noreferrer" download={doc.arquivo_nome}>
                    <Button variant="ghost" size="icon" title="Baixar">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button variant="ghost" size="icon" title="Remover" onClick={() => setRemovendo(doc)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
          {!mostrarForm && (
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Adicionar documento
            </Button>
          )}
        </>
      )}

      <DeleteConfirmDialog
        titulo="Remover documento"
        open={Boolean(removendo)}
        onOpenChange={(o) => !o && setRemovendo(null)}
        descricao={removendo?.nome}
        isPending={remover.isPending}
        onConfirm={() => { if (removendo) return remover.mutateAsync({ id: removendo.id, url: removendo.arquivo_url }); }}
      />
    </div>
  );
}
