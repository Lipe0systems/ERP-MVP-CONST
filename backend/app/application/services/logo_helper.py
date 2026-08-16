"""
Resolve a logo a ser usada num PDF: a logo REAL da empresa (baixada do
Storage), com fallback pra logo da própria plataforma quando a empresa não
tem uma cadastrada. Compartilhado por todos os geradores de PDF — evita
duplicar essa lógica em cada um deles (orçamento, venda, compras, etc.).

Camada: Application (services).
"""
from __future__ import annotations
import logging
import os
import tempfile

from supabase import create_client

from app.core.config import get_settings

logger = logging.getLogger("uvicorn.error")

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")
LOGO_PLATAFORMA_PATH = os.path.join(ASSETS_DIR, "logo-inovak.png")
BUCKET = "documentos"


def resolver_logo_pdf(logo_path_empresa: str | None) -> str | None:
    """
    Retorna o caminho de um arquivo LOCAL de imagem pronto pra usar no PDF
    (reportlab precisa de um caminho de arquivo, não consegue ler direto do
    Storage). Se a empresa tem logo cadastrada, baixa pra um arquivo
    temporário; senão, cai pra logo padrão da plataforma; se nem essa
    existir, retorna None (quem chama decide o fallback em texto).
    """
    if logo_path_empresa:
        try:
            settings = get_settings()
            admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            dados = admin.storage.from_(BUCKET).download(logo_path_empresa)

            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            tmp.write(dados)
            tmp.close()
            return tmp.name
        except Exception:
            # Arquivo pode ter sido apagado por fora do app, ou rede falhou —
            # não deve travar a geração do PDF por causa disso; cai pro
            # fallback da plataforma abaixo, e registra pra investigação.
            logger.exception(
                "Falha ao baixar logo da empresa do Storage (path=%s). "
                "PDF será gerado com a logo padrão da plataforma.",
                logo_path_empresa,
            )

    return LOGO_PLATAFORMA_PATH if os.path.exists(LOGO_PLATAFORMA_PATH) else None
