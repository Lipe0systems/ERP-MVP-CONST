"use client";

/**
 * SearchableSelect — dropdown com busca em tempo real.
 * Substitui os <select> com pageSize=100 (que só carregam os primeiros 100
 * itens) por uma busca debounced que sempre retorna resultados relevantes,
 * independente do volume de dados.
 *
 * Props:
 * - value: id selecionado atualmente
 * - onChange: callback com o novo id
 * - onSearch: função assíncrona que recebe o termo e retorna { id, label }[]
 * - placeholder: texto quando nenhum item selecionado
 * - currentLabel: label do item atual (para exibir quando já há seleção)
 * - disabled: desabilitar o componente
 */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (id: string) => void;
  onSearch: (term: string) => Promise<SearchableOption[]>;
  placeholder?: string;
  currentLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  onSearch,
  placeholder = "Selecione...",
  currentLabel,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [options, setOptions] = useState<SearchableOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(currentLabel ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincronizar label externo (ex.: quando formulário é resetado)
  useEffect(() => {
    if (currentLabel !== undefined) setSelectedLabel(currentLabel);
  }, [currentLabel]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Busca debounced
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Mesma proteção de race condition da busca global: sem a flag, uma
    // resposta lenta de um termo antigo pode chegar depois e sobrescrever
    // a lista do termo atual — o usuário veria opções que não batem com
    // o que digitou (e poderia selecionar o registro errado).
    let atual = true;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await onSearch(term);
        if (!atual) return;
        setOptions(results);
      } finally {
        if (atual) setLoading(false);
      }
    }, 300);

    return () => {
      atual = false; if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [term, open, onSearch]);

  function handleOpen() {
    if (disabled) return;
    setOpen(true);
    setTerm("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSelect(opt: SearchableOption) {
    onChange(opt.id);
    setSelectedLabel(opt.label);
    setOpen(false);
    setTerm("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setSelectedLabel("");
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn(!selectedLabel && "text-muted-foreground")}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as any)}
              className="rounded p-0.5 hover:bg-muted"
              aria-label="Limpar seleção"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : options.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {term ? "Nenhum resultado." : "Digite para buscar."}
              </p>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <Check
                    className={cn("h-4 w-4 shrink-0", value === opt.id ? "opacity-100" : "opacity-0")}
                  />
                  <span className="flex-1">
                    {opt.label}
                    {opt.sublabel && (
                      <span className="ml-1 text-xs text-muted-foreground">— {opt.sublabel}</span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
