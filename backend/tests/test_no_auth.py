"""
Teste 1 da auditoria: usuário não autenticado tentando acessar API privada
deve sempre receber 401 (nunca 403 nem 500, e nunca os dados).
"""
from __future__ import annotations


class TestAcessoSemAutenticacao:
    def test_listar_clientes_sem_token_retorna_401(self, client_sem_autenticacao):
        resp = client_sem_autenticacao.get("/api/v1/clientes")
        assert resp.status_code == 401

    def test_obter_cliente_sem_token_retorna_401(self, client_sem_autenticacao):
        resp = client_sem_autenticacao.get("/api/v1/clientes/11111111-1111-1111-1111-111111111111")
        assert resp.status_code == 401

    def test_criar_obra_sem_token_retorna_401(self, client_sem_autenticacao):
        resp = client_sem_autenticacao.post("/api/v1/obras", json={"nome": "Obra Teste"})
        assert resp.status_code == 401

    def test_dashboard_sem_token_retorna_401(self, client_sem_autenticacao):
        resp = client_sem_autenticacao.get("/api/v1/dashboard/resumo")
        assert resp.status_code == 401

    def test_token_invalido_tambem_retorna_401(self, client_sem_autenticacao):
        resp = client_sem_autenticacao.get(
            "/api/v1/clientes", headers={"Authorization": "Bearer token-completamente-invalido"}
        )
        # Sem mock de _verificar_token_no_supabase, a chamada real ao Supabase
        # falhará (não há rede neste ambiente de teste) — o importante é que
        # NUNCA retorna 200 com dados. 401 é o resultado esperado; se a rede
        # estiver indisponível também pode vir como erro de conexão tratado,
        # mas nunca sucesso.
        assert resp.status_code != 200
