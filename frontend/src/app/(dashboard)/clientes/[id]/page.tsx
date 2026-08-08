"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, ClipboardList, Edit, FileText,
  FolderOpen, Loader2, Mail, MapPin, Phone, ShoppingBag, User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OrcamentoStatusBadge } from "@/components/orcamentos/orcamento-status-badge";
import { DocumentosPanel } from "@/components/documentos/documentos-panel";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { useCliente } from "@/hooks/use-clientes";
import { useOrcamentos } from "@/hooks/use-orcamentos";
import { useAtendimentos } from "@/hooks/use-atendimentos";
import { useVendas } from "@/hooks/use-vendas";
import { formatMoeda, formatData } from "@/lib/format";
import { STATUS_ATENDIMENTO_LABEL, STATUS_VENDA_LABEL, TIPO_ATENDIMENTO_LABEL } from "@/types";
import type { StatusAtendimento, StatusVenda } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_ATEND_COLOR: Record<StatusAtendimento, string> = {
  agendado: "bg-amber-100 text-amber-700",
  realizado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

const STATUS_VENDA_COLOR: Record<StatusVenda, string> = {
  aberta: "bg-amber-100 text-amber-700",
  paga: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function ClientePerfilPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const { data: cliente, isLoading } = useCliente(id);

  const { data: orcsData } = useOrcamentos({
    search: "", status: "todos", page: 1, pageSize: 50,
  });
  const orcamentos = (orcsData?.items ?? []).filter((o) => o.cliente_id === id);

  const { data: atendData } = useAtendimentos({
    cliente_id: id, page: 1, pageSize: 50,
  });
  const atendimentos = atendData?.items ?? [];

  const { data: vendasData } = useVendas({ page: 1, pageSize: 50 });
  const vendas = (vendasData?.items ?? []).filter((v) => v.cliente_id === id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  const enderecoCompleto = [
    cliente.logradouro,
    cliente.numero ? `nº ${cliente.numero}` : null,
    cliente.complemento,
    cliente.bairro,
    cliente.cidade,
    cliente.estado,
  ].filter(Boolean).join(", ") || cliente.endereco || null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{cliente.nome}</h1>
            <p className="text-sm text-muted-foreground">{cliente.documento}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Dados do cliente */}
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="space-y-2">
            {cliente.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{cliente.email}</span>
              </div>
            )}
            {(cliente.telefone || cliente.whatsapp) && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{cliente.telefone || cliente.whatsapp}</span>
              </div>
            )}
            {enderecoCompleto && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{enderecoCompleto}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <InfoRow label="RG" value={cliente.rg} />
            <InfoRow label="WhatsApp" value={cliente.whatsapp} />
            <InfoRow label="Nascimento" value={cliente.data_nascimento ? formatData(cliente.data_nascimento) : null} />
            <InfoRow label="Sexo" value={cliente.sexo === "M" ? "Masculino" : cliente.sexo === "F" ? "Feminino" : cliente.sexo ?? null} />
          </div>
          {cliente.observacoes && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Observações</p>
              <p className="text-sm">{cliente.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Abas */}
      <Tabs defaultValue="orcamentos">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orcamentos" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Orçamentos
            {orcamentos.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{orcamentos.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="vendas" className="gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            Vendas
            {vendas.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{vendas.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="atendimentos" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Atendimentos
            {atendimentos.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{atendimentos.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* Orçamentos */}
        <TabsContent value="orcamentos" className="mt-4 space-y-2">
          {orcamentos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum orçamento para este cliente.</p>
          ) : (
            orcamentos.map((orc) => (
              <div key={orc.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Orçamento #{String(orc.numero).padStart(4, "0")}</p>
                  <p className="text-xs text-muted-foreground">{formatData(orc.criado_em)}{orc.obra_nome ? ` · ${orc.obra_nome}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <OrcamentoStatusBadge status={orc.status as any} />
                  <span className="text-sm font-medium">{formatMoeda(orc.valor_total)}</span>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Vendas */}
        <TabsContent value="vendas" className="mt-4 space-y-2">
          {vendas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma venda para este cliente.</p>
          ) : (
            vendas.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Venda #{String(v.numero).padStart(4, "0")}</p>
                  <p className="text-xs text-muted-foreground">{formatData(v.criado_em)} · {v.num_parcelas}x</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_VENDA_COLOR[v.status])}>
                    {STATUS_VENDA_LABEL[v.status]}
                  </span>
                  <span className="text-sm font-medium">{formatMoeda(v.valor_liquido)}</span>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Atendimentos */}
        <TabsContent value="atendimentos" className="mt-4 space-y-2">
          {atendimentos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum atendimento para este cliente.</p>
          ) : (
            atendimentos.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{TIPO_ATENDIMENTO_LABEL[a.tipo]} · {formatData(a.data)}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.obra_nome ? `${a.obra_nome} · ` : ""}{a.responsavel || "Sem responsável"}
                    {a.checklist.length > 0 && ` · ${a.checklist_ok.length}/${a.checklist.length} itens`}
                  </p>
                </div>
                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_ATEND_COLOR[a.status])}>
                  {STATUS_ATENDIMENTO_LABEL[a.status]}
                </span>
              </div>
            ))
          )}
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos" className="mt-4">
          <DocumentosPanel clienteId={id} />
        </TabsContent>
      </Tabs>

      <ClienteFormDialog open={editOpen} onOpenChange={setEditOpen} cliente={cliente as any} />
    </div>
  );
}
