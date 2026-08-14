"""
Testes de autenticação (app/core/security.py).

Cobrem diretamente o achado [CRITICAL] da auditoria: empresa_id e papel
devem vir SEMPRE da tabela `usuarios` no banco, nunca do token/metadata do
Supabase Auth (que o próprio usuário logado poderia reescrever sozinho).

Estes testes chamam get_current_user diretamente (não via TestClient),
simulando a resposta do banco com MagicMock — o que basta aqui, porque o
que estamos validando é a LÓGICA de decisão da função (o que ela faz com
o resultado da query), não a query em si.
"""
from __future__ import annotations
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.core.security import get_current_user


def _payload_supabase_valido(user_id: str = "11111111-1111-1111-1111-111111111111") -> dict:
    """Simula a resposta que o servidor do Supabase Auth devolveria para um token válido."""
    return {"id": user_id, "email": "usuario@empresa.com"}


class _UsuarioFake:
    def __init__(self, id, empresa_id, papel="admin", ativo=True):
        self.id = id
        self.empresa_id = empresa_id
        self.email = "usuario@empresa.com"
        self.papel = papel
        self.ativo = ativo


def test_usuario_sem_vinculo_recebe_403():
    """Conta autenticada no Supabase mas sem linha em `usuarios` → 403, nunca acesso."""
    db = MagicMock()
    db.query.return_value.join.return_value.filter.return_value.first.return_value = None

    with patch("app.core.security._verificar_token_no_supabase", return_value=_payload_supabase_valido()):
        credentials = MagicMock(credentials="token-fake")
        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=credentials, db=db)

    assert exc.value.status_code == 403


def test_usuario_inativo_recebe_403():
    """Usuário existe mas está com ativo=false → 403, mesmo com token válido."""
    db = MagicMock()
    usuario = _UsuarioFake(id="11111111-1111-1111-1111-111111111111", empresa_id="empresa-x", ativo=False)
    db.query.return_value.join.return_value.filter.return_value.first.return_value = (usuario, True)

    with patch("app.core.security._verificar_token_no_supabase", return_value=_payload_supabase_valido()):
        credentials = MagicMock(credentials="token-fake")
        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=credentials, db=db)

    assert exc.value.status_code == 403


def test_empresa_desativada_bloqueia_usuario_ativo():
    """
    Usuário individualmente ativo, mas a EMPRESA dele foi desativada pelo
    admin do SaaS → 403. Sem este teste, o botão "Desativar empresa" da
    tela de gestão de empresas não teria efeito nenhum na prática.
    """
    db = MagicMock()
    usuario = _UsuarioFake(id="11111111-1111-1111-1111-111111111111", empresa_id="empresa-x", ativo=True)
    db.query.return_value.join.return_value.filter.return_value.first.return_value = (usuario, False)  # empresa.ativo=False

    with patch("app.core.security._verificar_token_no_supabase", return_value=_payload_supabase_valido()):
        credentials = MagicMock(credentials="token-fake")
        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=credentials, db=db)

    assert exc.value.status_code == 403


def test_empresa_e_papel_vem_do_banco_nao_do_token():
    """
    O CORAÇÃO da correção CRITICAL: mesmo que o payload do token traga um
    empresa_id ou papel diferentes (simulando um token forjado/user_metadata
    alterado), o resultado final deve ser SEMPRE o que está no banco.
    """
    db = MagicMock()
    usuario = _UsuarioFake(
        id="11111111-1111-1111-1111-111111111111",
        empresa_id="empresa-verdadeira-no-banco",
        papel="membro",
        ativo=True,
    )
    db.query.return_value.join.return_value.filter.return_value.first.return_value = (usuario, True)

    payload_com_tentativa_de_forjar = {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "usuario@empresa.com",
        # Um payload malicioso poderia trazer isso — não deve ter efeito algum:
        "user_metadata": {"empresa_id": "empresa-de-outra-pessoa", "papel": "admin"},
        "app_metadata": {"empresa_id": "outra-empresa-tambem"},
    }

    with patch("app.core.security._verificar_token_no_supabase", return_value=payload_com_tentativa_de_forjar):
        credentials = MagicMock(credentials="token-fake")
        resultado = get_current_user(credentials=credentials, db=db)

    assert resultado.empresa_id == "empresa-verdadeira-no-banco"
    assert resultado.papel == "membro"
