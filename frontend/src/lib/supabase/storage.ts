/**
 * Upload de fotos do Diário de Obra direto para o Supabase Storage, a
 * partir do navegador — o backend nunca recebe os bytes do arquivo, só a
 * URL pública resultante (ver docs/DEPLOY.md para criar o bucket).
 */
import { createClient } from "@/lib/supabase/client";

const BUCKET = "diario-obra";
const TAMANHO_MAXIMO_MB = 5;
const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export class StorageError extends Error {}

function sanitizarNomeArquivo(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9.\-_]/g, "-");
}

export function validarArquivoFoto(file: File): string | null {
  if (!TIPOS_ACEITOS.includes(file.type)) {
    return "Formato não suportado. Envie uma imagem JPEG, PNG, WEBP ou HEIC.";
  }
  if (file.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return `Cada foto deve ter no máximo ${TAMANHO_MAXIMO_MB}MB.`;
  }
  return null;
}

export async function uploadFotoDiario(obraId: string, file: File): Promise<string> {
  const erro = validarArquivoFoto(file);
  if (erro) throw new StorageError(erro);

  const supabase = createClient();
  const caminho = `${obraId}/${crypto.randomUUID()}-${sanitizarNomeArquivo(file.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new StorageError(`Falha ao enviar a foto: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
  return data.publicUrl;
}

/**
 * Remove uma foto do Storage a partir da sua URL pública. Usada quando o
 * usuário remove uma foto antes de salvar o registro, ou apaga um registro
 * inteiro — best-effort: se falhar, não bloqueia a ação do usuário (o
 * registro/formulário não deve ficar preso por causa de um arquivo órfão).
 */
export async function removerFotoDiario(url: string): Promise<void> {
  try {
    const marcador = `/object/public/${BUCKET}/`;
    const indice = url.indexOf(marcador);
    if (indice === -1) return;

    const caminho = decodeURIComponent(url.slice(indice + marcador.length));
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([caminho]);
  } catch {
    // Best-effort — não propaga erro para não travar a UI por causa de
    // limpeza de storage; na pior hipótese fica um arquivo órfão no bucket.
  }
}
