"""
Testes de autorização por papel (RBAC).

Cobrem o achado [HIGH] da auditoria: a checagem de admin estava quebrada
(CurrentUser nunca tinha o atributo `papel`, então `_exige_admin` sempre
bloqueava todo mundo, inclusive administradores reais). Depois da correção,
`papel` vem do banco e a checagem passou a funcionar de verdade — estes
testes garantem que continua funcionando em futuras alterações.
"""
from __future__ import annotations
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.core.security import exigir_admin, CurrentUser


def _usuario(papel: str) -> CurrentUser:
    return CurrentUser(id="u1", email="x@x.com", empresa_id="empresa-a", papel=papel, raw={})


def test_visualizador_e_bloqueado_de_acao_admin():
    """Usuário com papel 'visualizador' não pode passar por exigir_admin."""
    with pytest.raises(HTTPException) as exc:
        exigir_admin(current_user=_usuario("visualizador"))
    assert exc.value.status_code == 403


def test_membro_e_bloqueado_de_acao_admin():
    """Usuário com papel 'membro' (sem privilégio elevado) também é bloqueado."""
    with pytest.raises(HTTPException) as exc:
        exigir_admin(current_user=_usuario("membro"))
    assert exc.value.status_code == 403


def test_admin_passa_por_exigir_admin():
    """
    Usuário com papel 'admin' passa normalmente — este é o teste que teria
    falhado ANTES da correção (o bug fazia isso retornar 403 mesmo para
    admins reais, travando toda a gestão de usuários da plataforma).
    """
    resultado = exigir_admin(current_user=_usuario("admin"))
    assert resultado.papel == "admin"


class TestEndpointsProtegidosPorAdmin:
    """
    Confirma que os endpoints mais sensíveis (identificados na auditoria
    como precisando de proteção admin) de fato recusam um Visualizador.

    Usa os fixtures de conftest.py — client_empresa_a_visualizador já vem
    autenticado com papel 'visualizador'.
    """

    def test_apagar_definitivo_da_lixeira_recusa_visualizador(self, client_empresa_a_visualizador):
        client, _db = client_empresa_a_visualizador
        resp = client.delete("/api/v1/lixeira/clientes/11111111-1111-1111-1111-111111111111")
        assert resp.status_code == 403

    def test_expurgar_lixeira_recusa_visualizador(self, client_empresa_a_visualizador):
        client, _db = client_empresa_a_visualizador
        resp = client.post("/api/v1/lixeira/expurgar")
        assert resp.status_code == 403

    def test_exportar_backup_recusa_visualizador(self, client_empresa_a_visualizador):
        client, _db = client_empresa_a_visualizador
        resp = client.post("/api/v1/backup/exportar", json={"formato": "excel", "modulos": []})
        assert resp.status_code == 403

    def test_backup_completo_recusa_visualizador(self, client_empresa_a_visualizador):
        client, _db = client_empresa_a_visualizador
        resp = client.get("/api/v1/backup/completo")
        assert resp.status_code == 403
