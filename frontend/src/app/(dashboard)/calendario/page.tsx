"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, CalendarDays,
  Clock, Landmark, HardHat, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Evento {
  id: string;
  tipo: string;
  titulo: string;
  subtitulo: string;
  data: string;
  cor: string;
  link: string;
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const TIPO_ICONE: Record<string, React.ElementType> = {
  atendimento: ClipboardList,
  conta_pagar: Landmark,
  conta_receber: Landmark,
  obra: HardHat,
};

async function fetchEventos(ano: number, mes: number): Promise<Evento[]> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const inicio = new Date(ano, mes, 1);
  const fim = new Date(ano, mes + 1, 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/calendario/eventos?data_inicio=${fmt(inicio)}&data_fim=${fmt(fim)}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.eventos ?? [];
}

function gerarDiasDoMes(ano: number, mes: number): (Date | null)[] {
  const primeiro = new Date(ano, mes, 1);
  const ultimo = new Date(ano, mes + 1, 0);
  const dias: (Date | null)[] = [];

  // Preencher com nulls antes do primeiro dia
  for (let i = 0; i < primeiro.getDay(); i++) dias.push(null);

  // Dias do mês
  for (let d = 1; d <= ultimo.getDate(); d++) dias.push(new Date(ano, mes, d));

  // Completar última semana
  while (dias.length % 7 !== 0) dias.push(null);

  return dias;
}

export default function CalendarioPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchEventos(ano, mes).then((evs) => {
      setEventos(evs);
      setLoading(false);
    });
  }, [ano, mes]);

  function navMes(delta: number) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 0) { novoMes = 11; novoAno--; }
    if (novoMes > 11) { novoMes = 0; novoAno++; }
    setMes(novoMes);
    setAno(novoAno);
    setDiaSelecionado(null);
  }

  const dias = gerarDiasDoMes(ano, mes);

  // Agrupar eventos por data
  const porData = eventos.reduce<Record<string, Evento[]>>((acc, ev) => {
    acc[ev.data] = acc[ev.data] ? [...acc[ev.data], ev] : [ev];
    return acc;
  }, {});

  const eventosDiaSelecionado = diaSelecionado ? (porData[diaSelecionado] ?? []) : [];

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarDays} title="Calendário" subtitle="Atendimentos, vencimentos e obras" cor="cyan">
        <Button variant="outline" size="sm" onClick={() => { setAno(hoje.getFullYear()); setMes(hoje.getMonth()); }}>
          Hoje
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendário */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Navegação do mês */}
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navMes(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-semibold">{MESES[mes]} {ano}</h2>
              <Button variant="ghost" size="icon" onClick={() => navMes(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Cabeçalho dos dias */}
            <div className="mb-1 grid grid-cols-7 text-center">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="py-1 text-[11px] font-medium text-muted-foreground">{d}</div>
              ))}
            </div>

            {/* Grade do calendário */}
            {loading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-0.5">
                {dias.map((dia, i) => {
                  if (!dia) return <div key={i} />;
                  const dataStr = dia.toISOString().split("T")[0];
                  const evsDia = porData[dataStr] ?? [];
                  const isHoje = dataStr === hoje.toISOString().split("T")[0];
                  const isSelecionado = dataStr === diaSelecionado;

                  return (
                    <button
                      key={dataStr}
                      onClick={() => setDiaSelecionado(isSelecionado ? null : dataStr)}
                      className={cn(
                        "flex min-h-[4rem] flex-col rounded-md p-1 text-left transition-colors",
                        isHoje && "bg-amber-500/10 font-semibold",
                        isSelecionado && "ring-2 ring-amber-500",
                        !isSelecionado && "hover:bg-muted/50"
                      )}
                    >
                      <span className={cn(
                        "mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        isHoje && "bg-amber-500 text-white font-bold"
                      )}>
                        {dia.getDate()}
                      </span>
                      <div className="space-y-0.5 overflow-hidden">
                        {evsDia.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className="truncate rounded px-1 text-[10px] font-medium text-white"
                            style={{ backgroundColor: ev.cor }}
                            title={ev.titulo}
                          >
                            {ev.titulo}
                          </div>
                        ))}
                        {evsDia.length > 3 && (
                          <div className="text-[10px] text-muted-foreground">+{evsDia.length - 3}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legenda */}
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { cor: "#f59e0b", label: "Atendimento" },
                { cor: "#f97316", label: "A pagar" },
                { cor: "#22c55e", label: "A receber" },
                { cor: "#ef4444", label: "Vencido" },
                { cor: "#6366f1", label: "Obra" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.cor }} />
                  <span className="text-xs text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Painel lateral — eventos do dia selecionado ou do mês */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {diaSelecionado
              ? new Date(diaSelecionado + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
              : "Selecione um dia"}
          </h3>

          {diaSelecionado && eventosDiaSelecionado.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
            </div>
          )}

          {(diaSelecionado ? eventosDiaSelecionado : eventos.slice(0, 8)).map((ev) => {
            const Icone = TIPO_ICONE[ev.tipo] ?? CalendarDays;
            return (
              <Link key={ev.id} href={ev.link}>
                <div className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white" style={{ backgroundColor: ev.cor }}>
                    <Icone className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ev.titulo}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {ev.subtitulo && <><Clock className="h-3 w-3" /><span>{ev.subtitulo}</span></>}
                      {!diaSelecionado && <span className="ml-auto">{new Date(ev.data + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {!diaSelecionado && eventos.length > 8 && (
            <p className="text-center text-xs text-muted-foreground">
              +{eventos.length - 8} eventos no mês — clique em um dia para ver
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
