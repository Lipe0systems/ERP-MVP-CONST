"use client";

import { PageHeader } from "@/components/page-header";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/client";
import { formatData } from "@/lib/format";

const PAGE_SIZE = 20;

const MODULO_LABEL: Record<string, string> = {
  orcamentos: "Orçamentos", vendas: "Vendas", financeiro: "Financeiro",
  clientes: "Clientes", obras: "Obras", compras: "Compras", estoque: "Estoque",
};

const ACAO_LABEL: Record<string, string> = {
  criou: "Criou", editou: "Editou", excluiu: "Excluiu",
  aprovou: "Aprovou", cancelou: "Cancelou", recusou: "Recusou", recebeu: "Recebeu",
};

const ACAO_COLOR: Record<string, string> = {
  criou: "text-green-600", editou: "text-amber-600", excluiu: "text-destructive",
  aprovou: "text-green-600", cancelou: "text-destructive",
  recusou: "text-red-500", recebeu: "text-blue-600",
};

async function fetchAuditoria(params: { modulo: string; dataInicio: string; dataFim: string; page: number }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const q = new URLSearchParams({ page: String(params.page), page_size: String(PAGE_SIZE) });
  if (params.modulo) q.set("modulo", params.modulo);
  if (params.dataInicio) q.set("data_inicio", params.dataInicio);
  if (params.dataFim) q.set("data_fim", params.dataFim);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auditoria?${q}`, {
    headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
  });
  if (!res.ok) throw new Error("Falha ao carregar auditoria");
  return res.json();
}

export default function AuditoriaPage() {
  const [modulo, setModulo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["auditoria", { modulo, dataInicio, dataFim, page }],
    queryFn: () => fetchAuditoria({ modulo, dataInicio, dataFim, page }),
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} title="Auditoria" subtitle="Log de ações nos módulos críticos" cor="purple" />

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={modulo}
          onChange={(e) => { setModulo(e.target.value); setPage(1); }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos os módulos</option>
          {Object.entries(MODULO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Input
          type="date"
          value={dataInicio}
          onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
          className="h-10 w-auto"
          placeholder="Data início"
        />
        <Input
          type="date"
          value={dataFim}
          onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
          className="h-10 w-auto"
          placeholder="Data fim"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhum registro de auditoria"
          description="As ações nos módulos críticos aparecerão aqui."
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="hidden sm:table-cell">Módulo</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.criado_em).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm">{item.usuario_email}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {MODULO_LABEL[item.modulo] ?? item.modulo}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${ACAO_COLOR[item.acao] ?? ""}`}>
                        {ACAO_LABEL[item.acao] ?? item.acao}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{item.descricao}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
