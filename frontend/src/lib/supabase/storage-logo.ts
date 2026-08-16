/**
 * Upload da logo da empresa — mesmo bucket de Documentos, mas com regras
 * próprias: só imagem, limite menor, e retorna o CAMINHO (não a URL
 * assinada), porque é isso que o backend grava e depois transforma em URL
 * assinada na hora da leitura (URLs assinadas expiram, caminho não).
 */
import { createClient } from "@/lib/supabase/client";

const BUCKET = "documentos";
const TAMANHO_MAXIMO_MB = 5;

const TIPOS_ACEITOS = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export class LogoStorageError extends Error {}

function sanitizar(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-");
}

export function validarArquivoLogo(file: File): string | null {
  if (!TIPOS_ACEITOS.has(file.type)) {
    return "Formato não suportado. Envie PNG, JPG, WEBP ou SVG.";
  }
  if (file.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return `A imagem deve ter no máximo ${TAMANHO_MAXIMO_MB}MB.`;
  }
  return null;
}

export async function uploadLogoEmpresa(empresaId: string, file: File): Promise<string> {
  const erro = validarArquivoLogo(file);
  if (erro) throw new LogoStorageError(erro);

  const supabase = createClient();
  // Prefixo "logo-empresa/" é exigido pelo backend (defesa em profundidade
  // — ver validador de LogoIn no router de empresa).
  const caminho = `logo-empresa/${empresaId}/${crypto.randomUUID()}-${sanitizar(file.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new LogoStorageError(`Falha ao enviar a imagem: ${error.message}`);

  return caminho;
}
