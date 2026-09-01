"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Building2, HardHat, FileText, Truck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Resultado {
  tipo: string; id: string; titulo: string; subtitulo: string; link: string;
}

const TIPO_ICONE: Record<string, React.ElementType> = {
  cliente: Building2, obra: HardHat, orcamento: FileText, fornecedor: Truck,
};
const TIPO_LABEL: Record<string, string> = {
  cliente: "Cliente", obra: "Obra", orcamento: "Orçamento", fornecedor: "Fornecedor",
};
const TIPO_COLOR: Record<string, string> = {
  cliente: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  obra: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  orcamento: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  fornecedor: "bg-green-500/10 text-green-600 dark:text-green-400",
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
  return (await res.json()).resultados ?? [];
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery(""); setResultados([]); setSelecionado(0);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResultados([]); return; }

    // RACE CONDITION: o debounce cancelava o timer, mas não a requisição
    // JÁ EM VOO. Digitando rápido ("obra" → "obras"), se a resposta de
    // "obra" chegasse depois da de "obras", ela sobrescrevia o resultado
    // correto — o usuário via resultados de um texto que já não estava
    // mais no campo. A flag `atual` faz respostas obsoletas serem
    // descartadas ao chegar.
    let atual = true;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await buscar(query);
        if (!atual) return;
        setResultados(r);
        setSelecionado(0);
      } finally {
        // Só mexe no loading se esta ainda é a busca vigente — senão uma
        // resposta antiga desligaria o loading de uma busca em andamento.
        if (atual) setLoading(false);
      }
    }, 280);

    return () => {
      atual = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function navegar(link: string) { router.push(link); setOpen(false); }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelecionado((s) => Math.min(s + 1, resultados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelecionado((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && resultados[selecionado]) navegar(resultados[selecionado].link);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-input bg-background/60",
          "px-3 py-1.5 text-sm text-muted-foreground",
          "transition-[background-color,border-color] duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
          "hover:bg-background hover:border-foreground/20",
        )}
        aria-label="Busca global"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] sm:flex">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="fixed left-1/2 top-[15vh] z-50 w-full max-w-md -translate-x-1/2 px-4 animate-in fade-in zoom-in-95 duration-200 [animation-timing-function:cubic-bezier(0.23,1,0.32,1)]">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-2xl dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/8">
          {/* Input */}
          <div className="flex items-center gap-3 border-b px-4 py-3.5">
            {loading
              ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              : <Search className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Buscar clientes, instalações, orçamentos..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <button onClick={() => setOpen(false)} className="rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Resultados */}
          <div className="max-h-72 overflow-y-auto">
            {query.length < 2 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                Digite ao menos 2 caracteres
              </p>
            ) : resultados.length === 0 && !loading ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                Nenhum resultado para "{query}"
              </p>
            ) : (
              <div className="py-1.5">
                {resultados.map((r, i) => {
                  const Icone = TIPO_ICONE[r.tipo] ?? Search;
                  return (
                    <button
                      key={`${r.tipo}-${r.id}`}
                      onClick={() => navegar(r.link)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left",
                        "transition-colors duration-100 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
                        i === selecionado ? "bg-muted" : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", TIPO_COLOR[r.tipo] ?? "bg-muted")}>
                        <Icone className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{r.titulo}</p>
                        {r.subtitulo && <p className="truncate text-[11px] text-muted-foreground">{r.subtitulo}</p>}
                      </div>
                      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {TIPO_LABEL[r.tipo] ?? r.tipo}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {resultados.length > 0 && (
            <div className="flex items-center gap-4 border-t px-4 py-2 text-[10px] text-muted-foreground/70">
              <span>↑↓ navegar</span><span>↵ abrir</span><span>Esc fechar</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
