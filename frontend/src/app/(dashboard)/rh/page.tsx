"use client";

import { useState } from "react";
import {
  Users, Plus, Pencil, Trash2, Search, CalendarCheck,
  Building2, DollarSign, Briefcase, HardHat,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { FuncionarioFormDialog } from "@/components/rh/funcionario-form-dialog";
import { AlocacaoDialog } from "@/components/rh/alocacao-dialog";
import { PontoTab } from "@/components/rh/ponto-tab";
import { CustoObraTab } from "@/components/rh/custo-obra-tab";
import { useFuncionarios, useRemoverFuncionario } from "@/hooks/use-rh";
import { TIPO_CONTRATACAO_LABEL } from "@/types";
import type { Funcionario } from "@/types";
import { formatMoeda, formatData } from "@/lib/format";
import { cn } from "@/lib/utils";

type Aba = "funcionarios" | "ponto" | "custo";

const ABAS: { id: Aba; label: string; icon: React.ElementType }[] = [
  { id: "funcionarios", label: "Funcionários", icon: Users },
  { id: "ponto", label: "Folha de ponto", icon: CalendarCheck },
  { id: "custo", label: "Custo por obra", icon: DollarSign },
];

export default function RhPage() {
  const [aba, setAba] = useState<Aba>("funcionarios");

  return (
    <div className="space-y-6">
      <PageHeader icon={Briefcase} title="Recursos Humanos" subtitle="Funcionários, folha de ponto e custo de mão de obra" cor="purple" />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border bg-muted/40 p-1">
        {ABAS.map((a) => {
          const ativo = aba === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,border-color,color] duration-150 ease-ui",
                ativo ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <a.icon className={cn("h-4 w-4", ativo && "text-purple-500")} />
              <span className="hidden sm:inline">{a.label}</span>
            </button>
          );
        })}
      </div>

      {aba === "funcionarios" && <FuncionariosTab />}
      {aba === "ponto" && <PontoTab />}
      {aba === "custo" && <CustoObraTab />}
    </div>
  );
}

function FuncionariosTab() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [removendo, setRemovendo] = useState<Funcionario | null>(null);
  const [alocando, setAlocando] = useState<Funcionario | null>(null);

  const { data, isLoading } = useFuncionarios({ search: search || undefined });
  const remover = useRemoverFuncionario();

  const funcionarios = data?.items ?? [];

  function novo() { setEditando(null); setFormOpen(true); }
  function editar(f: Funcionario) { setEditando(f); setFormOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou cargo" className="pl-9" />
        </div>
        <Button onClick={novo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo funcionário
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : funcionarios.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum funcionário" description="Cadastre seu primeiro funcionário para começar." actionLabel="Novo funcionário" onAction={novo} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Contratação</TableHead>
                  <TableHead className="text-right">Salário</TableHead>
                  <TableHead className="hidden sm:table-cell">Admissão</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{f.cargo ?? "—"}</TableCell>
                    <TableCell><Badge variant="info">{TIPO_CONTRATACAO_LABEL[f.tipo_contratacao]}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoeda(f.salario)}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{f.data_admissao ? formatData(f.data_admissao) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Alocar em obra" onClick={() => setAlocando(f)}>
                          <HardHat className="h-3.5 w-3.5 text-amber-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editar(f)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRemovendo(f)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FuncionarioFormDialog open={formOpen} onOpenChange={setFormOpen} funcionario={editando} />
      <AlocacaoDialog open={Boolean(alocando)} onOpenChange={(o) => !o && setAlocando(null)} funcionario={alocando} />
      <DeleteConfirmDialog
        titulo="Desligar funcionário"
        open={Boolean(removendo)}
        onOpenChange={(o) => !o && setRemovendo(null)}
        descricao={removendo ? `${removendo.nome} será marcado como inativo (o histórico é preservado).` : undefined}
        isPending={remover.isPending}
        onConfirm={() => { if (removendo) return remover.mutateAsync(removendo.id); }}
      />
    </div>
  );
}
