"use client";

import { useState } from "react";
import Image from "next/image";
import { BookText, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { DiarioFormDialog } from "@/components/diario-obra/diario-form-dialog";
import { ClimaBadge } from "@/components/diario-obra/clima-icon";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { useObras } from "@/hooks/use-obras";
import { useRegistrosDiario, useRemoverRegistroDiario } from "@/hooks/use-diario-obra";
import { removerFotoDiario } from "@/lib/supabase/storage";
import { formatData } from "@/lib/format";
import type { RegistroDiarioListItem } from "@/types";

const PAGE_SIZE = 9;

export default function DiarioObraPage() {
  const [obraId, setObraId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [registroEditando, setRegistroEditando] = useState<RegistroDiarioListItem | null>(null);
  const [registroRemovendo, setRegistroRemovendo] = useState<RegistroDiarioListItem | null>(null);

  const remover = useRemoverRegistroDiario();

  // page_size alto o bastante para o filtro; só busca quando a tela está
  // com o usuário nela (a rota inteira já é montada sob demanda pelo Next).
  const { data: obrasData } = useObras({ search: "", status: "todos", page: 1, pageSize: 100 });

  const { data, isLoading, isError, isFetching } = useRegistrosDiario({
    obraId: obraId || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const registros = data?.items ?? [];
  const emptyState = !isLoading && registros.length === 0;

  function handleNovo() {
    setRegistroEditando(null);
    setFormOpen(true);
  }

  function handleEditar(registro: RegistroDiarioListItem) {
    setRegistroEditando(registro);
    setFormOpen(true);
  }

  function handleObraChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setObraId(e.target.value);
    setPage(1);
  }

  async function handleConfirmarRemocao() {
    if (!registroRemovendo) return;
    // Remove o registro do banco primeiro: se isso falhar, não mexemos no
    // Storage (evitaria ficar com fotos apagadas mas o registro ainda
    // existindo, com links quebrados). Só depois de confirmado, limpamos as
    // fotos — best-effort, não bloqueia nem falha a exclusão do registro.
    await remover.mutateAsync(registroRemovendo.id);
    await Promise.allSettled(registroRemovendo.fotos.map((url) => removerFotoDiario(url)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Diário de Obra</h1>
          <p className="text-sm text-muted-foreground">Registro diário de atividades, clima e fotos</p>
        </div>
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo registro
        </Button>
      </div>

      <Select value={obraId} onChange={handleObraChange} className="sm:w-64">
        <option value="">Todas as obras</option>
        {(obrasData?.items ?? []).map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </Select>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Não foi possível carregar o diário de obra. Tente novamente em instantes.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : emptyState ? (
        <EmptyState
          icon={BookText}
          title="Nenhum registro encontrado"
          description={obraId ? "Tente selecionar outra obra." : "Comece registrando o primeiro dia de atividades."}
          actionLabel={obraId ? undefined : "Novo registro"}
          onAction={obraId ? undefined : handleNovo}
        />
      ) : (
        <>
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? "opacity-60 transition-opacity" : ""}`}>
            {registros.map((registro) => (
              <Card key={registro.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{formatData(registro.data)}</p>
                      <p className="text-xs text-muted-foreground">{registro.obra_nome}</p>
                    </div>
                    {registro.clima && <ClimaBadge clima={registro.clima} />}
                  </div>

                  <p className="flex-1 whitespace-pre-line text-sm text-muted-foreground">
                    {registro.observacoes}
                  </p>

                  {registro.fotos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {registro.fotos.slice(0, 4).map((url, i) => (
                        <div key={url} className="relative h-14 w-14 overflow-hidden rounded-md border">
                          <Image src={url} alt="Foto da obra" fill className="object-cover" unoptimized />
                          {i === 3 && registro.fotos.length > 4 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-medium text-white">
                              +{registro.fotos.length - 4}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-1 border-t pt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditar(registro)}
                      aria-label={`Editar registro de ${formatData(registro.data)}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRegistroRemovendo(registro)}
                      aria-label={`Remover registro de ${formatData(registro.data)}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
        </>
      )}

      <DiarioFormDialog open={formOpen} onOpenChange={setFormOpen} registro={registroEditando} />
      <DeleteConfirmDialog
        titulo="Remover registro de diário"
        open={Boolean(registroRemovendo)}
        onOpenChange={(open) => !open && setRegistroRemovendo(null)}
        descricao={registroRemovendo ? `o registro de ${formatData(registroRemovendo.data)}` : undefined}
        isPending={remover.isPending}
        onConfirm={handleConfirmarRemocao}
      />
    </div>
  );
}
