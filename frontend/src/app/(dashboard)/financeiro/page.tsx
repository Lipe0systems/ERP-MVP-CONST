"use client";

import { ArrowDownCircle, ArrowUpCircle, FileDown, Wallet } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContasPagarTable } from "@/components/financeiro/contas-pagar-table";
import { ContasReceberTable } from "@/components/financeiro/contas-receber-table";
import { useResumoFinanceiro } from "@/hooks/use-financeiro";
import { formatMoeda } from "@/lib/format";
import { baixarRelatorioFinanceiro } from "@/lib/api/relatorios";
import { toast } from "sonner";

export default function FinanceiroPage() {
  const { data: resumo, isLoading } = useResumoFinanceiro();

  const cards = [
    {
      label: "Total a pagar",
      value: resumo?.total_a_pagar,
      icon: ArrowDownCircle,
      className: "text-destructive",
    },
    {
      label: "Total a receber",
      value: resumo?.total_a_receber,
      icon: ArrowUpCircle,
      className: "text-green-600 dark:text-green-400",
    },
    {
      label: "Saldo previsto",
      value: resumo?.saldo_previsto,
      icon: Wallet,
      className: (resumo?.saldo_previsto ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Contas a pagar, contas a receber e fluxo de caixa</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            try { await baixarRelatorioFinanceiro(); } catch { toast.error("Erro ao gerar relatório."); }
          }}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Relatório PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.className}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold ${card.className}`}>
                {isLoading ? "…" : formatMoeda(card.value ?? 0)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de caixa (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resumo?.fluxo_de_caixa ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value: number) => formatMoeda(value)} />
                <Line type="monotone" dataKey="entrada" name="Entradas" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="saida" name="Saídas" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="pagar">
        <TabsList>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
        </TabsList>
        <TabsContent value="pagar">
          <ContasPagarTable />
        </TabsContent>
        <TabsContent value="receber">
          <ContasReceberTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
