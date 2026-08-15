"use client";

import { useEffect, useState } from "react";
import {
  Database, Download, FileSpreadsheet, FileJson, FileArchive,
  CheckCircle2, Loader2, ShieldCheck, Info, Paperclip,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listarModulosBackup, exportarBackup, baixarBackupCompleto,
  type ModuloBackup,
} from "@/lib/api/backup";
import { cn } from "@/lib/utils";

type Formato = "excel" | "csv" | "json";

const FORMATOS: { id: Formato; label: string; desc: string; icon: React.ElementType; grad: string }[] = [
  { id: "excel", label: "Excel", desc: "Uma aba por módulo, formatado", icon: FileSpreadsheet, grad: "from-green-500 to-emerald-600" },
  { id: "csv", label: "CSV (.zip)", desc: "Um arquivo por módulo", icon: FileArchive, grad: "from-blue-500 to-indigo-600" },
  { id: "json", label: "JSON", desc: "Backup restaurável completo", icon: FileJson, grad: "from-purple-500 to-fuchsia-600" },
];

export default function BackupPage() {
  const [modulos, setModulos] = useState<ModuloBackup[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [formato, setFormato] = useState<Formato>("excel");
  const [incluirArquivos, setIncluirArquivos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [backupTotal, setBackupTotal] = useState(false);

  useEffect(() => {
    listarModulosBackup()
      .then((m) => {
        setModulos(m);
        setSelecionados(new Set(m.map((x) => x.chave))); // tudo marcado por padrão
      })
      .catch(() => toast.error("Erro ao carregar módulos."))
      .finally(() => setLoading(false));
  }, []);

  function toggle(chave: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(chave) ? next.delete(chave) : next.add(chave);
      return next;
    });
  }

  function toggleTodos() {
    if (selecionados.size === modulos.length) setSelecionados(new Set());
    else setSelecionados(new Set(modulos.map((m) => m.chave)));
  }

  async function handleExportar() {
    if (selecionados.size === 0) {
      toast.error("Selecione ao menos um módulo.");
      return;
    }
    setExportando(true);
    try {
      await exportarBackup(formato, Array.from(selecionados), incluirArquivos);
      toast.success(incluirArquivos ? "Backup com arquivos gerado! Pode levar alguns segundos." : "Exportação gerada! O download deve iniciar automaticamente.");
    } catch {
      toast.error("Erro ao gerar exportação.");
    } finally {
      setExportando(false);
    }
  }

  async function handleBackupTotal() {
    setBackupTotal(true);
    try {
      await baixarBackupCompleto();
      toast.success("Backup completo gerado!");
    } catch {
      toast.error("Erro ao gerar backup completo.");
    } finally {
      setBackupTotal(false);
    }
  }

  const todosSelecionados = selecionados.size === modulos.length && modulos.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader icon={Database} title="Backup e Exportação" subtitle="Baixe seus dados em Excel, CSV ou backup completo" cor="cyan" />

      {/* Backup total em destaque */}
      <div className="relative overflow-hidden rounded-2xl panel p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-float" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Backup completo</h2>
              <p className="mt-0.5 text-sm text-white/80 max-w-md">
                Baixe um único arquivo JSON com todos os dados da sua empresa. Guarde em local seguro — ele pode ser usado para restauração.
              </p>
            </div>
          </div>
          <Button
            onClick={handleBackupTotal}
            disabled={backupTotal}
            className="shrink-0 bg-white text-blue-600 hover:bg-white/90 shadow-lg"
          >
            {backupTotal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Baixar backup total
          </Button>
        </div>
      </div>

      {/* Exportação seletiva */}
      <Card className="card-vivid">
        <CardContent className="space-y-6 p-6">
          <div>
            <h3 className="text-base font-semibold">Exportação personalizada</h3>
            <p className="text-sm text-muted-foreground">Escolha o formato e os módulos que deseja exportar</p>
          </div>

          {/* Escolha de formato */}
          <div className="grid gap-3 sm:grid-cols-3">
            {FORMATOS.map((f) => {
              const ativo = formato === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormato(f.id)}
                  className={cn(
                    "relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-150 ease-ui",
                    ativo ? "border-transparent ring-2 ring-amber-500 bg-amber-500/[0.04]" : "hover:border-muted-foreground/30"
                  )}
                >
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg tint-amber")}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                  {ativo && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-amber-500" />}
                </button>
              );
            })}
          </div>

          {/* Seleção de módulos */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Módulos {formato === "json" && <span className="text-xs text-muted-foreground">(JSON sempre inclui tudo)</span>}</p>
              <button
                onClick={toggleTodos}
                disabled={formato === "json"}
                className="text-xs font-medium text-amber-600 hover:underline disabled:opacity-40"
              >
                {todosSelecionados ? "Desmarcar todos" : "Marcar todos"}
              </button>
            </div>

            {loading ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
              </div>
            ) : (
              <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-3", formato === "json" && "pointer-events-none opacity-50")}>
                {modulos.map((m) => {
                  const marcado = selecionados.has(m.chave);
                  return (
                    <button
                      key={m.chave}
                      onClick={() => toggle(m.chave)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors duration-100",
                        marcado ? "border-amber-500/40 bg-amber-500/[0.06]" : "hover:bg-muted/50"
                      )}
                    >
                      <span className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        marcado ? "border-amber-500 bg-amber-500 text-white" : "border-muted-foreground/40"
                      )}>
                        {marcado && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      <span className={cn("truncate", marcado ? "font-medium" : "text-muted-foreground")}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Incluir arquivos anexados */}
          {formato !== "json" && (
            <button
              onClick={() => setIncluirArquivos((v) => !v)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150 ease-ui",
                incluirArquivos ? "border-transparent ring-2 ring-purple-500 bg-purple-500/[0.04]" : "hover:border-muted-foreground/30"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg tint-purple">
                <Paperclip className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Incluir arquivos anexados</p>
                <p className="text-xs text-muted-foreground">
                  Adiciona os documentos (PDFs, fotos, contratos) num .zip junto com os dados. Pode deixar o download mais lento.
                </p>
              </div>
              <span className={cn(
                "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
                incluirArquivos ? "bg-purple-500 justify-end" : "bg-muted justify-start"
              )}>
                <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
              </span>
            </button>
          )}

          {/* Ação */}
          <div className="flex items-center justify-between border-t pt-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              {formato === "json" ? "Todos os dados serão incluídos" : `${selecionados.size} de ${modulos.length} módulos selecionados`}
            </p>
            <Button onClick={handleExportar} disabled={exportando} className="bg-grad-brand text-white glow-sm hover:opacity-95">
              {exportando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {incluirArquivos && formato !== "json" ? "Exportar .zip" : `Exportar ${formato === "excel" ? "Excel" : formato === "csv" ? "CSV" : "JSON"}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
