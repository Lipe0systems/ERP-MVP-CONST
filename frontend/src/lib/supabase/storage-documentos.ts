/**
 * Upload de documentos diretamente para o Supabase Storage, a partir do
 * navegador (mesmo padrão do Diário de Instalação). O backend nunca recebe os bytes
 * do arquivo — só a URL resultante.
 *
 * Antes de usar: crie o bucket "documentos" como bucket PRIVADO no Supabase
 * e adicione as três policies listadas em docs/schema_documentos.sql.
 */
import { createClient } from "@/lib/supabase/client";

const BUCKET = "documentos";
const TAMANHO_MAXIMO_MB = 20;

const TIPOS_ACEITOS = new Set([
  "application/pdf",
  "image/jpeg", "image/png", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export class DocumentoStorageError extends Error {}

function sanitizar(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-");
}

export function validarArquivoDocumento(file: File): string | null {
  if (!TIPOS_ACEITOS.has(file.type)) {
    return "Formato não suportado. Envie PDF, imagem, Word ou Excel.";
  }
  if (file.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return `O arquivo deve ter no máximo ${TAMANHO_MAXIMO_MB}MB.`;
  }
  return null;
}

export async function uploadDocumento(
  entidade: string,  // ex.: "clientes", "obras", "orcamentos"
  entidadeId: string,
  file: File,
): Promise<{ url: string; nome: string; tipo: string; tamanho: number }> {
  const erro = validarArquivoDocumento(file);
  if (erro) throw new DocumentoStorageError(erro);

  const supabase = createClient();
  const caminho = `${entidade}/${entidadeId}/${crypto.randomUUID()}-${sanitizar(file.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new DocumentoStorageError(`Falha ao enviar o arquivo: ${error.message}`);

  // Bucket privado → URL assinada (válida por 1 ano — suficiente para uso normal)
  const { data: signedData, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, 365 * 24 * 60 * 60);

  if (signErr || !signedData) throw new DocumentoStorageError("Não foi possível gerar URL de acesso.");

  return { url: signedData.signedUrl, nome: file.name, tipo: file.type, tamanho: file.size };
}

export async function removerDocumentoStorage(url: string): Promise<void> {
  try {
    const supabase = createClient();
    // Extrai o caminho relativo da URL assinada
    const match = url.match(/\/object\/sign\/documentos\/([^?]+)/);
    if (!match) return;
    const caminho = decodeURIComponent(match[1]);
    await supabase.storage.from(BUCKET).remove([caminho]);
  } catch {
    // Best-effort — não propaga erro
  }
}
