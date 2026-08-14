"""
Testes de validação de entrada (schemas Pydantic).

Estes são os testes mais confiáveis da suíte: rodam 100% em memória, sem
precisar de banco, mock de rede nem nada externo — testam só a validação
dos schemas, que é puramente lógica.

Cobrem os achados [MEDIUM] "arquivo_url sem validação" e a validação de
tipo/tamanho de upload adicionada como defesa em profundidade.
"""
from __future__ import annotations
import pytest
from pydantic import ValidationError

from app.presentation.schemas.documento import DocumentoRegistrarIn


def _payload_base(**overrides) -> dict:
    base = {
        "nome": "Contrato.pdf",
        "arquivo_url": "https://xxxxxxxx.supabase.co/storage/v1/object/sign/documentos/x.pdf?token=abc",
        "arquivo_nome": "Contrato.pdf",
        "arquivo_tipo": "application/pdf",
        "arquivo_tamanho": 1024,
    }
    base.update(overrides)
    return base


class TestValidacaoUrlDocumento:
    """Achado [MEDIUM]: arquivo_url aceito sem validar domínio permitia phishing interno."""

    def test_url_de_dominio_externo_e_rejeitada(self):
        with pytest.raises(ValidationError):
            DocumentoRegistrarIn(**_payload_base(arquivo_url="https://evil.example.com/phish.pdf"))

    def test_url_http_sem_https_e_rejeitada(self):
        with pytest.raises(ValidationError):
            DocumentoRegistrarIn(**_payload_base(
                arquivo_url="http://xxxxxxxx.supabase.co/storage/v1/object/sign/documentos/x.pdf"
            ))

    def test_esquema_javascript_e_rejeitado(self):
        """Tentativa clássica de XSS via link — javascript: no lugar de https:."""
        with pytest.raises(ValidationError):
            DocumentoRegistrarIn(**_payload_base(arquivo_url="javascript:alert(document.cookie)"))


class TestValidacaoTipoETamanho:
    """Defesa em profundidade: mesmo que alguém chame a API diretamente
    (contornando a validação do frontend), o backend recusa."""

    def test_tipo_nao_permitido_e_rejeitado(self):
        with pytest.raises(ValidationError):
            DocumentoRegistrarIn(**_payload_base(arquivo_tipo="application/x-msdownload"))

    def test_tipo_html_e_rejeitado(self):
        """HTML/SVG são vetores conhecidos de XSS armazenado se servidos inline."""
        with pytest.raises(ValidationError):
            DocumentoRegistrarIn(**_payload_base(arquivo_tipo="text/html"))

    def test_arquivo_acima_do_limite_e_rejeitado(self):
        vinte_e_um_mb = 21 * 1024 * 1024
        with pytest.raises(ValidationError):
            DocumentoRegistrarIn(**_payload_base(arquivo_tamanho=vinte_e_um_mb))

    def test_pdf_dentro_do_limite_e_aceito(self):
        doc = DocumentoRegistrarIn(**_payload_base(arquivo_tamanho=5 * 1024 * 1024))
        assert doc.arquivo_tipo == "application/pdf"


class TestValidacaoCnpj:
    """Achado geral de validação de input — CNPJ já validado, garante que continua."""

    def test_cnpj_com_menos_de_14_digitos_e_rejeitado(self):
        from app.presentation.schemas.onboarding import OnboardingCreate

        with pytest.raises(ValidationError):
            OnboardingCreate(
                empresa_nome="Teste Ltda",
                empresa_cnpj="123",
                admin_nome="Admin",
                admin_email="admin@teste.com",
                admin_senha="senha12345",
            )
