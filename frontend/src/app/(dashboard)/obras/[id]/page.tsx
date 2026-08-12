"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, HardHat, LayoutDashboard, Loader2, MapPin, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ObraStatusBadge } from "@/components/obras/obra-status-badge";
import { ResultadoObraCard } from "@/components/obras/resultado-obra-card";
import { useObra } from "@/hooks/use-obras";
import { formatData } from "@/lib/format";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}: <span className="text-foreground">{value}</span></span>
    </div>
  );
}

export default function ObraDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: obra, isLoading } = useObra(params.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Obra não encontrada.</p>
        <Button variant="outline" onClick={() => router.push("/obras")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/obras")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-grad-brand text-white shadow-lg ring-4 ring-amber-500/20">
          <HardHat className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{obra.nome}</h1>
          <div className="flex items-center gap-2">
            <ObraStatusBadge status={obra.status} />
          </div>
        </div>
        <Button onClick={() => router.push(`/obras/${obra.id}/workspace`)} className="bg-grad-brand text-white glow-sm">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Abrir workspace
        </Button>
      </div>

      <Card className="card-vivid">
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
          <InfoRow icon={MapPin} label="Endereço" value={obra.endereco} />
          <InfoRow icon={User} label="Responsável" value={obra.responsavel} />
          <InfoRow icon={Calendar} label="Início" value={obra.data_inicio ? formatData(obra.data_inicio) : null} />
          <InfoRow icon={Calendar} label="Prazo previsto" value={obra.data_previsao ? formatData(obra.data_previsao) : null} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">Resultado da obra</h2>
        <ResultadoObraCard obraId={obra.id} />
      </div>
    </div>
  );
}
