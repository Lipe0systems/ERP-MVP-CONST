"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Check, ChevronRight, FileText, HardHat, Loader2,
  ShoppingBag, Trash2, User, Download, Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { OrcamentoFormDialog } from "@/components/orcamentos/orcamento-form-dialog";
import { VendaDeOrcamentoDialog } from "@/components/vendas/venda-de-orcamento-dialog";
import { CriarObraDialog } from "@/components/orcamentos/criar-obra-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  useProcesso, useVincularCliente, useVincularOrcamento,
  useAvancarParaVenda, useVincularVenda, useVincularObra, useAbandonarProcesso,
} from "@/hooks/use-workspace";
import { listarClientes } from "@/lib/api/clientes";
import { baixarPdfOrcamento } from "@/lib/api/orcamentos";
import { formatMoeda } from "@/lib/format";
import type { FaseProcesso } from "@/lib/api/workspace";
import { cn } from "@/lib/utils";

const FASES: { id: FaseProcesso; label: string }[] = [
  { id: "cliente", label: "Cliente" },
  { id: "orcamento", label: "Orçamento" },
  { id: "proposta", label: "Proposta" },
  { id: "venda", label: "Venda" },
  { id: "obra", label: "Instalação" },
  { id: "concluido", label: "Concluído" },
];

function ordemFase(f: FaseProcesso) {
  return FASES.findIndex((x) => x.id === f);
}

export default function WorkspaceProcessoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: p, isLoading } = useProcesso(params.id);

  const vincularCliente = useVincularCliente();
  const vincularOrcamento = useVincularOrcamento();
  const avancarVenda = useAvancarParaVenda();
  const vincularVenda = useVincularVenda();
  const vincularObra = useVincularObra();
  const abandonar = useAbandonarProcesso();

  const [clienteSelecionado, setClienteSelecionado] = useState("");

  const [clienteFormOpen, setClienteFormOpen] = useState(false);
  const [orcamentoFormOpen, setOrcamentoFormOpen] = useState(false);
  const [vendaFormOpen, setVendaFormOpen] = useState(false);
  const [obraFormOpen, setObraFormOpen] = useState(false);
  const [abandonarOpen, setAbandonarOpen] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Processo não encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/workspace")}>Voltar</Button>
      </div>
    );
  }

  const faseAtualIdx = ordemFase(p.fase);

  async function handleVincularClienteExistente() {
    if (!clienteSelecionado) return;
    await vincularCliente.mutateAsync({ processoId: p!.id, clienteId: clienteSelecionado });
  }

  async function handleBaixarProposta() {
    if (!p!.orcamento_id) return;
    setGerandoPdf(true);
    try {
      await baixarPdfOrcamento(p!.orcamento_id);
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/workspace")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {p.cliente_nome ?? p.nome ?? "Novo projeto"}
            </h1>
            <p className="text-sm text-muted-foreground">Workspace comercial</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setAbandonarOpen(true)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Stepper */}
      <div className="card-vivid overflow-x-auto rounded-2xl p-4">
        <div className="flex min-w-max items-center gap-1">
          {FASES.map((f, idx) => {
            const concluida = idx < faseAtualIdx || p.fase === "concluido";
            const atual = idx === faseAtualIdx && p.fase !== "concluido";
            return (
              <div key={f.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    concluida ? "bg-green-500 text-white" :
                    atual ? "bg-grad-brand text-white shadow-md" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {concluida ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className={cn("text-[11px] font-medium", atual ? "text-foreground" : "text-muted-foreground")}>
                    {f.label}
                  </span>
                </div>
                {idx < FASES.length - 1 && (
                  <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da etapa */}
      <Card>
        <CardContent className="p-6">
          {p.fase === "cliente" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">Escolha o cliente</h2>
                <p className="text-sm text-muted-foreground">Selecione um cliente existente ou cadastre um novo.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <SearchableSelect
                    value={clienteSelecionado}
                    onChange={setClienteSelecionado}
                    onSearch={async (termo) => {
                      const res = await listarClientes({ search: termo, page: 1, pageSize: 20 });
                      return res.items.map((c) => ({ id: c.id, label: c.nome }));
                    }}
                    placeholder="Buscar cliente..."
                  />
                </div>
                <Button onClick={handleVincularClienteExistente} disabled={!clienteSelecionado || vincularCliente.isPending}>
                  {vincularCliente.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
                  Usar este cliente
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full" onClick={() => setClienteFormOpen(true)}>
                Cadastrar novo cliente
              </Button>
            </div>
          )}

          {p.fase === "orcamento" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" /> Cliente: <strong>{p.cliente_nome}</strong>
              </div>
              <div>
                <h2 className="text-base font-semibold">Monte o orçamento</h2>
                <p className="text-sm text-muted-foreground">Adicione os itens, quantidades e valores.</p>
              </div>
              <Button onClick={() => setOrcamentoFormOpen(true)} className="bg-grad-brand text-white glow-sm">
                <FileText className="mr-2 h-4 w-4" />
                Criar orçamento
              </Button>
            </div>
          )}

          {p.fase === "proposta" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" /> Orçamento #{p.orcamento_numero} — {formatMoeda(p.orcamento_valor_total ?? 0)}
              </div>
              <div>
                <h2 className="text-base font-semibold">Proposta pronta para envio</h2>
                <p className="text-sm text-muted-foreground">
                  Baixe o PDF e envie ao cliente. Quando o orçamento for aprovado no módulo Orçamentos, volte aqui para gerar a venda.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleBaixarProposta} disabled={gerandoPdf}>
                  {gerandoPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Baixar proposta em PDF
                </Button>
                <Button
                  onClick={() => avancarVenda.mutate(p.id)}
                  disabled={avancarVenda.isPending || p.orcamento_status !== "aprovado"}
                  className="bg-grad-brand text-white glow-sm"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {p.orcamento_status === "aprovado" ? "Continuar para venda" : "Aguardando aprovação do orçamento"}
                </Button>
              </div>
              {p.orcamento_status !== "aprovado" && (
                <p className="text-xs text-muted-foreground">
                  Aprove o orçamento na tela de Orçamentos para liberar o próximo passo.
                </p>
              )}
            </div>
          )}

          {p.fase === "venda" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" /> Proposta aprovada
              </div>
              <div>
                <h2 className="text-base font-semibold">Gerar venda</h2>
                <p className="text-sm text-muted-foreground">
                  Confirme a forma de pagamento e as parcelas. As contas a receber são criadas automaticamente.
                </p>
              </div>
              <Button onClick={() => setVendaFormOpen(true)} className="bg-grad-brand text-white glow-sm">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Gerar venda
              </Button>
            </div>
          )}

          {p.fase === "obra" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" /> Venda #{p.venda_numero} gerada
              </div>
              <div>
                <h2 className="text-base font-semibold">Criar a obra</h2>
                <p className="text-sm text-muted-foreground">
                  Cliente, valor e prazo serão reaproveitados automaticamente do orçamento.
                </p>
              </div>
              <Button onClick={() => setObraFormOpen(true)} className="bg-grad-brand text-white glow-sm">
                <HardHat className="mr-2 h-4 w-4" />
                Criar obra
              </Button>
            </div>
          )}

          {p.fase === "concluido" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Processo concluído!</h2>
                <p className="text-sm text-muted-foreground">
                  A obra <strong>{p.obra_nome}</strong> foi criada a partir deste processo.
                </p>
              </div>
              <Button onClick={() => router.push(`/obras/${p.obra_id}`)} className="bg-grad-brand text-white glow-sm">
                <HardHat className="mr-2 h-4 w-4" />
                Ir para a obra
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs reaproveitados dos módulos existentes */}
      <ClienteFormDialog
        open={clienteFormOpen}
        onOpenChange={setClienteFormOpen}
        onCriado={(clienteId) => vincularCliente.mutate({ processoId: p.id, clienteId })}
      />

      {p.orcamento_id === null && (
        <OrcamentoFormDialog
          open={orcamentoFormOpen}
          onOpenChange={setOrcamentoFormOpen}
          clienteIdInicial={p.cliente_id}
          onCriado={(orcId) => vincularOrcamento.mutate({ processoId: p.id, orcamentoId: orcId })}
        />
      )}

      {p.orcamento_id && p.orcamento_numero && (
        <VendaDeOrcamentoDialog
          open={vendaFormOpen}
          onOpenChange={setVendaFormOpen}
          orcamentoId={p.orcamento_id}
          orcamentoNumero={p.orcamento_numero}
          valorTotal={p.orcamento_valor_total ?? 0}
          onCriado={(vendaId) => vincularVenda.mutate({ processoId: p.id, vendaId })}
        />
      )}

      {p.orcamento_id && p.orcamento_numero && (
        <CriarObraDialog
          open={obraFormOpen}
          onOpenChange={setObraFormOpen}
          orcamentoId={p.orcamento_id}
          orcamentoNumero={p.orcamento_numero}
          valorTotal={p.orcamento_valor_total ?? 0}
          onCriado={(obraId) => vincularObra.mutate({ processoId: p.id, obraId })}
        />
      )}

      <DeleteConfirmDialog
        titulo="Abandonar processo"
        open={abandonarOpen}
        onOpenChange={setAbandonarOpen}
        descricao="O cliente, orçamento ou venda já criados NÃO serão apagados — apenas este processo guiado será removido."
        isPending={abandonar.isPending}
        onConfirm={async () => { await abandonar.mutateAsync(p.id); router.push("/workspace"); }}
      />
    </div>
  );
}
