"""
Fixtures compartilhados para os testes de segurança.

Estratégia: os testes usam o mecanismo de `dependency_overrides` do FastAPI
para substituir `get_current_user`/`get_empresa_id`/`get_db` por versões
controladas. A sessão de banco é um `MagicMock`, não SQLite nem Postgres
real — os models usam tipos específicos do PostgreSQL (UUID nativo) que
não têm compatibilidade garantida com SQLite, então simular o banco com
mock evita testes que "passam" ou "falham" por causa de uma incompatibilidade
de dialeto, e não por causa da lógica que realmente queremos validar aqui:
AUTORIZAÇÃO (quem pode fazer o quê), não persistência de dados.

IMPORTANTE — isto é intencional e tem uma limitação conhecida: os testes
aqui confirmam que a camada de autenticação/autorização (get_current_user,
get_empresa_id, exigir_admin) bloqueia corretamente quem deveria ser
bloqueado. Eles NÃO substituem testar isolamento multi-tenant com dados
reais contra um Postgres/Supabase de homologação antes de ir para produção
— isso continua sendo necessário e está descrito no relatório da auditoria.
"""
from __future__ import annotations
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import CurrentUser, get_current_user, get_empresa_id
from app.infrastructure.database.session import get_db


def _fake_user(empresa_id: str, papel: str = "admin") -> CurrentUser:
    return CurrentUser(
        id="11111111-1111-1111-1111-111111111111",
        email="teste@empresa-a.com",
        empresa_id=empresa_id,
        papel=papel,
        raw={},
    )


EMPRESA_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
EMPRESA_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


@pytest.fixture
def mock_db():
    """
    Sessão de banco simulada. Por padrão, `.query(...).filter(...).first()`
    e `.all()` retornam None/lista vazia — cada teste que precisar de um
    retorno específico configura isso explicitamente.
    """
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.filter.return_value.all.return_value = []
    return db


@pytest.fixture
def client_empresa_a(mock_db):
    """Cliente de teste autenticado como usuário ADMIN da Empresa A."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: _fake_user(EMPRESA_A, "admin")
    app.dependency_overrides[get_empresa_id] = lambda: EMPRESA_A
    yield TestClient(app), mock_db
    app.dependency_overrides.clear()


@pytest.fixture
def client_empresa_a_visualizador(mock_db):
    """Cliente de teste autenticado como VISUALIZADOR (sem privilégio admin) da Empresa A."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: _fake_user(EMPRESA_A, "visualizador")
    app.dependency_overrides[get_empresa_id] = lambda: EMPRESA_A
    yield TestClient(app), mock_db
    app.dependency_overrides.clear()


@pytest.fixture
def client_sem_autenticacao(mock_db):
    """
    Cliente de teste SEM nenhum override de get_current_user — simula uma
    requisição sem token válido (a dependency real será executada e deve
    rejeitar por falta de credenciais).
    """
    app.dependency_overrides[get_db] = lambda: mock_db
    yield TestClient(app)
    app.dependency_overrides.clear()
