"""
Auto-save de documentos gerados pelo sistema (V4).

Quando o sistema gera um PDF — orçamento, venda, diário de obra, etc. —
este serviço sobe o arquivo no Supabase Storage (bucket "documentos") e
cria automaticamente o registro na tabela de Documentos, vinculado ao
cliente/obra/orçamento correspondente. Assim, a aba Documentos de cada
cliente vira a "pasta" central de tudo que já foi gerado para ele —
sem exigir nenhuma ação manual do usuário.

Camada: Application.
"""
from __future__ import annotations

import re
import uuid
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.infrastructure.database.models.documento import DocumentoModel

BUCKET = "documentos"


def _sanitizar_nome_arquivo(nome: str) -> str:
    """
    Remove qualquer caractere que não seja letra/número/ponto/hífen/underscore
    do nome do arquivo antes de usá-lo para montar o caminho no Storage —
    defesa em profundidade contra path traversal (ex.: nome="../../x.pdf"),
    mesmo que hoje todos os chamadores desta função só passem nomes gerados
    pelo próprio servidor. Mesmo padrão usado no upload manual do frontend
    (storage-documentos.ts).
    """
    return re.sub(r"[^a-zA-Z0-9.\-_]", "-", nome)


def _upload_para_storage(caminho: str, conteudo: bytes, content_type: str) -> str | None:
    """
    Sobe um arquivo para o bucket privado usando a service role key e
    devolve uma URL assinada (mesma convenção usada no upload feito pelo
    frontend). Retorna None em caso de falha — best-effort, nunca quebra
    o fluxo principal (o PDF continua sendo entregue ao usuário mesmo se
    o auto-save falhar).
    """
    settings = get_settings()
    base = settings.SUPABASE_URL.rstrip("/")
    headers_upload = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": content_type,
    }
    try:
        with httpx.Client(timeout=30) as client:
            up = client.post(
                f"{base}/storage/v1/object/{BUCKET}/{caminho}",
                headers=headers_upload,
                content=conteudo,
            )
            if up.status_code not in (200, 201):
                return None

            # URL assinada, válida por 1 ano — mesmo padrão do upload manual
            sign = client.post(
                f"{base}/storage/v1/object/sign/{BUCKET}/{caminho}",
                headers={
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                },
                json={"expiresIn": 365 * 24 * 60 * 60},
            )
            if sign.status_code != 200:
                return None
            signed_path = sign.json().get("signedURL", "")
            if not signed_path:
                return None
            return f"{base}/storage/v1{signed_path}"
    except Exception:
        return None


def salvar_documento_automatico(
    db: Session,
    empresa_id: UUID,
    nome: str,
    conteudo_pdf: bytes,
    *,
    cliente_id: UUID | None = None,
    obra_id: UUID | None = None,
    orcamento_id: UUID | None = None,
    descricao: str | None = None,
) -> None:
    """
    Salva um PDF gerado pelo sistema como Documento, vinculado ao que fizer
    sentido (cliente/obra/orçamento). Silenciosamente não faz nada se não
    houver ao menos um vínculo — não teria onde essa "pasta" existir.
    """
    if not (cliente_id or obra_id or orcamento_id):
        return

    nome_seguro = _sanitizar_nome_arquivo(nome)
    caminho = f"gerados/{cliente_id or obra_id or orcamento_id}/{uuid.uuid4()}-{nome_seguro}"
    url = _upload_para_storage(caminho, conteudo_pdf, "application/pdf")
    if not url:
        return

    doc = DocumentoModel(
        id=uuid.uuid4(),
        empresa_id=empresa_id,
        nome=nome,
        arquivo_url=url,
        arquivo_nome=nome,
        arquivo_tipo="application/pdf",
        arquivo_tamanho=len(conteudo_pdf),
        cliente_id=cliente_id,
        obra_id=obra_id,
        orcamento_id=orcamento_id,
        descricao=descricao or "Gerado automaticamente pelo sistema.",
    )
    db.add(doc)
    db.commit()
