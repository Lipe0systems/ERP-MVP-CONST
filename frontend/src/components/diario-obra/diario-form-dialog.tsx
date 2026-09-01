"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FotoUploader } from "@/components/diario-obra/foto-uploader";
import { useAtualizarRegistroDiario, useCriarRegistroDiario } from "@/hooks/use-diario-obra";
import { getLocalISODate } from "@/lib/format";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { listarObras } from "@/lib/api/obras";
import { removerFotoDiario } from "@/lib/supabase/storage";
import { CLIMA_OBRA, CLIMA_OBRA_LABEL, type RegistroDiarioListItem } from "@/types";

const diarioSchema = z.object({
  obra_id: z.string().min(1, "Selecione uma instalação."),
  data: z.string().min(1, "Informe a data."),
  clima: z.enum(CLIMA_OBRA).optional().or(z.literal("")),
  observacoes: z.string().trim().min(2, "Descreva as atividades do dia."),
  fotos: z.array(z.string()),
});

type DiarioFormValues = z.infer<typeof diarioSchema>;

interface DiarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro?: RegistroDiarioListItem | null;
}

export function DiarioFormDialog({ open, onOpenChange, registro }: DiarioFormDialogProps) {
  const isEditing = Boolean(registro);
  const criar = useCriarRegistroDiario();
  const atualizar = useAtualizarRegistroDiario();
  const loading = criar.isPending || atualizar.isPending;

  async function buscarObras(term: string) {
    const res = await listarObras({ search: term, status: "todos", page: 1, pageSize: 20 });
    return res.items.map((o) => ({ id: o.id, label: o.nome }));
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<DiarioFormValues>({
    resolver: zodResolver(diarioSchema),
    defaultValues: { obra_id: "", data: "", clima: "", observacoes: "", fotos: [] },
  });

  const obraId = watch("obra_id");

  useEffect(() => {
    if (!open) return;
    reset(
      registro
        ? {
            obra_id: registro.obra_id,
            data: registro.data,
            clima: registro.clima ?? "",
            observacoes: registro.observacoes,
            fotos: registro.fotos,
          }
        : { obra_id: "", data: getLocalISODate(), clima: "", observacoes: "", fotos: [] }
    );
  }, [open, registro, reset]);

  async function onSubmit(values: DiarioFormValues) {
    const payload = {
      obra_id: values.obra_id,
      data: values.data,
      clima: values.clima || null,
      observacoes: values.observacoes,
      fotos: values.fotos,
    };

    try {
      if (isEditing && registro) {
        await atualizar.mutateAsync({ id: registro.id, data: payload });
      } else {
        await criar.mutateAsync(payload);
      }

      // Só agora — com o salvamento confirmado — é seguro apagar do Storage
      // as fotos que o usuário removeu durante a edição. Fazer isso antes
      // (ex.: na hora do clique no X) deixaria o registro com um link
      // quebrado caso o usuário cancelasse em vez de salvar.
      if (isEditing && registro) {
        const fotosRemovidas = registro.fotos.filter((url) => !values.fotos.includes(url));
        await Promise.allSettled(fotosRemovidas.map((url) => removerFotoDiario(url)));
      }

      onOpenChange(false);
    } catch {
      // Erro já exibido via toast pelo onError dos hooks de mutação.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar registro" : "Novo registro de diário"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize o registro do diário de obra." : "Registre as atividades do dia na obra."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Instalação *</Label>
              <SearchableSelect
                value={watch("obra_id") ?? ""}
                onChange={(id) => setValue("obra_id", id, { shouldValidate: true })}
                onSearch={buscarObras}
                placeholder="Buscar instalação..."
                currentLabel={registro?.obra_nome ?? ""}
              />
              {errors.obra_id && <p className="text-xs text-destructive">{errors.obra_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                aria-invalid={Boolean(errors.data)}
                {...register("data")}
              />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="clima">Clima</Label>
              <Select id="clima" {...register("clima")}>
                <option value="">Não informado</option>
                {CLIMA_OBRA.map((c) => (
                  <option key={c} value={c}>
                    {CLIMA_OBRA_LABEL[c]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="observacoes">Atividades do dia *</Label>
              <Textarea
                id="observacoes"
                rows={4}
                aria-invalid={Boolean(errors.observacoes)}
                {...register("observacoes")}
              />
              {errors.observacoes && <p className="text-xs text-destructive">{errors.observacoes.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Fotos</Label>
              <Controller
                name="fotos"
                control={control}
                render={({ field }) => (
                  <FotoUploader obraId={obraId} fotos={field.value} onChange={field.onChange} disabled={loading} />
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar alterações" : "Cadastrar registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
