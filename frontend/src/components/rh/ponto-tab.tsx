"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useFuncionarios, usePonto, useRegistrarPontoLote } from "@/hooks/use-rh";
import { STATUS_PONTO, STATUS_PONTO_LABEL } from "@/types";
import type { StatusPonto } from "@/types";
import { getLocalISODate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_COR: Record<StatusPonto, string> = {
  presente: "bg-green-500 text-white",
  falta: "bg-red-500 text-white",
  meio_periodo: "bg-amber-500 text-white",
  atestado: "bg-blue-500 text-white",
  ferias: "bg-purple-500 text-white",
  folga: "bg-slate-400 text-white",
};

export function PontoTab() {
  const [data, setData] = useState(getLocalISODate());
  const { data: funcData, isLoading: loadFunc } = useFuncionarios({ apenas_ativos: true });
  const { data: pontoDia, isLoading: loadPonto } = usePonto({ data_inicio: data, data_fim: data });
  const salvarLote = useRegistrarPontoLote();

  const funcionarios = funcData?.items ?? [];
  const [marcacoes, setMarcacoes] = useState<Record<string, StatusPonto>>({});

  // Sincroniza marcações com o que já foi salvo naquele dia
  useEffect(() => {
    const inicial: Record<string, StatusPonto> = {};
    for (const f of funcionarios) inicial[f.id] = "presente";
    for (const p of pontoDia ?? []) inicial[p.funcionario_id] = p.status;
    setMarcacoes(inicial);
  }, [pontoDia, funcData, data]); // eslint-disable-line

  function setStatus(fid: string, status: StatusPonto) {
    setMarcacoes((prev) => ({ ...prev, [fid]: status }));
  }

  function marcarTodos(status: StatusPonto) {
    const novo: Record<string, StatusPonto> = {};
    for (const f of funcionarios) novo[f.id] = status;
    setMarcacoes(novo);
  }

  async function salvar() {
    const registros = funcionarios.map((f) => ({ funcionario_id: f.id, status: marcacoes[f.id] ?? "presente" }));
    await salvarLote.mutateAsync({ data, registros });
  }

  return (
    <div className="space-y-4">
      <Card className="card-vivid">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Label htmlFor="data-ponto">Data</Label>
            <Input id="data-ponto" type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-44" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Marcar todos:</span>
            <button onClick={() => marcarTodos("presente")} className="rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-500/20">Presente</button>
            <button onClick={() => marcarTodos("falta")} className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/20">Falta</button>
          </div>
        </CardContent>
      </Card>

      {loadFunc || loadPonto ? (
        <Card className="card-vivid"><CardContent className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</CardContent></Card>
      ) : funcionarios.length === 0 ? (
        <Card className="card-vivid"><CardContent><EmptyState icon={CalendarCheck} title="Nenhum funcionário ativo" description="Cadastre funcionários para registrar a folha de ponto." /></CardContent></Card>
      ) : (
        <>
          <Card className="card-vivid">
            <CardContent className="divide-y p-0">
              {funcionarios.map((f) => (
                <div key={f.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.cargo ?? "—"}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_PONTO.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(f.id, s)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-100",
                          marcacoes[f.id] === s ? STATUS_COR[s] : "bg-muted text-muted-foreground hover:bg-muted/70"
                        )}
                      >
                        {STATUS_PONTO_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={salvar} disabled={salvarLote.isPending} className="bg-grad-brand text-white glow-sm">
              {salvarLote.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar ponto do dia
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
