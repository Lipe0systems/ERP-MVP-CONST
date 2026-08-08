"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Building2, HardHat, FileText, Truck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Resultado {
  tipo: string;
  id: string;
  titulo: string;
  subtitulo: string;
  link: string;
}

const TIPO_ICONE: Record<string, React.ElementType> = {
  cliente: Building2,
  obra: HardHat,
  orcamento: FileText,
  fornecedor: Truck,
};

const TIPO_LABEL: Record<string, string> = {
  cliente: "Cliente",
  obra: "Obra",
  orcamento: "Orçamento",
  fornecedor: "Fornecedor",
};

async function buscar(q: string): Promise<Resultado[]> {
  if (q.length < 2) return [];
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/busca?q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.resultados ?? [];
}

export function BuscaGlobal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecionado, setSelecionado] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K abre a busca
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focar no input quando abre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResultados([]);
      setSelecionado(0);
    }
  }, [open]);

  // Busca debounced
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResultados([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await buscar(query);
        setResultados(res);
        setSelecionado(0);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function navegar(link: string) {
    router.push(link);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelecionado((s) => Math.min(s + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelecionado((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && resultados[selecionado]) {
      navegar(resultados[selecionado].link);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
        aria-label="Busca global"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden rounded border bg-background px-1 text-[10px] sm:inline">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Modal de busca */}
      <div className="fixed left-1/2 top-20 z-50 w-full max-w-lg -translate-x-1/2 px-4">
        <div className="overflow-hidden rounded-xl border bg-white shadow-2xl dark:bg-zinc-900 ring-1 ring-black/10 dark:ring-white/10">
          {/* Input */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Buscar clientes, obras, orçamentos, fornecedores..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button onClick={() => setOpen(false)} aria-label="Fechar">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          {/* Resultados */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                Digite ao menos 2 caracteres para buscar
              </p>
            ) : resultados.length === 0 && !loading ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                Nenhum resultado para "{query}"
              </p>
            ) : (
              resultados.map((r, i) => {
                const Icone = TIPO_ICONE[r.tipo] ?? Search;
                return (
                  <button
                    key={`${r.tipo}-${r.id}`}
                    onClick={() => navegar(r.link)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      i === selecionado ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.titulo}</p>
                      {r.subtitulo && (
                        <p className="truncate text-xs text-muted-foreground">{r.subtitulo}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {TIPO_LABEL[r.tipo] ?? r.tipo}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Rodapé com dicas de teclado */}
          {resultados.length > 0 && (
            <div className="flex items-center gap-4 border-t px-4 py-2 text-[10px] text-muted-foreground">
              <span>↑↓ navegar</span>
              <span>↵ abrir</span>
              <span>Esc fechar</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
