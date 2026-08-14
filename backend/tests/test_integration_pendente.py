"""
Testes de integração PENDENTES — exigem um Postgres real (Supabase de
homologação, nunca produção) para serem executados de verdade.

POR QUE ESTES TESTES NÃO EXISTEM COMO MOCK: a suíte principal (test_auth.py,
test_rbac.py, test_no_auth.py, test_input_validation.py) usa MagicMock no
lugar do banco. Um MagicMock não executa SQL de verdade — `.filter(x == y)`
não filtra nada, só registra que foi chamado. Isso significa que um mock
NUNCA pode provar isolamento entre empresas: ele sempre devolveria o que
eu mandasse devolver, faça sentido ou não o filtro usado. Fingir testar
isso com mock daria uma falsa sensação de segurança — pior do que não ter
o teste.

COMO RODAR DE VERDADE (recomendado antes de qualquer deploy em produção):

1. Crie um branch de desenvolvimento no Supabase (ou um Postgres local
   descartável) — NUNCA rode isto contra o banco de produção.
2. Rode as migrações (docs/schema_*.sql) nesse banco de teste.
3. Defina a variável de ambiente TEST_DATABASE_URL apontando para ele.
4. Implemente os testes abaixo (estão como esqueleto/roteiro, não como
   testes funcionando) usando uma sessão SQLAlchemy real contra esse banco.
5. Rode com: pytest tests/test_integration_pendente.py

Isto está listado como pendência no relatório de auditoria de segurança.
"""
import os
import pytest

pytestmark = pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"),
    reason="Requer TEST_DATABASE_URL apontando para um Postgres de homologação — nunca produção.",
)


class TestIsolamentoEntreEmpresas:
    """Teste 2/3/4 da auditoria: leitura, alteração e exclusão cross-tenant."""

    def test_empresa_a_nao_ve_cliente_da_empresa_b(self):
        """
        Roteiro:
          1. Cria Cliente na Empresa A e Cliente na Empresa B (via fixtures
             reais com sessão de banco de verdade).
          2. Autentica como usuário da Empresa A.
          3. GET /clientes/{id_do_cliente_da_empresa_b}
          4. Espera 404 (não 403 — não deve nem confirmar que o registro existe).
        """
        pytest.skip("Implementar com sessão de banco real — ver docstring do módulo.")

    def test_empresa_a_nao_consegue_editar_obra_da_empresa_b(self):
        pytest.skip("Implementar com sessão de banco real — ver docstring do módulo.")

    def test_empresa_a_nao_consegue_apagar_documento_da_empresa_b(self):
        pytest.skip("Implementar com sessão de banco real — ver docstring do módulo.")


class TestRLS:
    """
    Valida se o RLS (docs/schema_rls.sql) está de fato bloqueando, e não
    apenas "instalado mas ignorado" (o caso do superusuário — ver a nota
    sobre isso no próprio schema_rls.sql).
    """

    def test_conexao_do_backend_nao_e_superusuario(self):
        """
        select usesuper from pg_user where usename = current_user;
        Deve ser False. Se for True, RLS é decorativo — ver schema_rls.sql.
        """
        pytest.skip("Implementar com sessão de banco real — ver docstring do módulo.")

    def test_query_sem_set_config_nao_retorna_dados_de_ninguem(self):
        """
        Conecta ao banco SEM chamar set_config('app.current_empresa_id', ...)
        e confirma que um SELECT em qualquer tabela protegida por RLS
        retorna 0 linhas (nega por padrão), não todas as linhas.
        """
        pytest.skip("Implementar com sessão de banco real — ver docstring do módulo.")


class TestSqlInjection:
    """Teste 9 da auditoria — com dados reais, tentando quebrar a query via input."""

    @pytest.mark.parametrize("payload_malicioso", [
        "'; DROP TABLE clientes; --",
        "' OR '1'='1",
        "1; SELECT * FROM usuarios",
    ])
    def test_busca_de_clientes_com_payload_sql_nao_quebra_nem_vaza(self, payload_malicioso):
        """
        GET /clientes?search=<payload>
        Espera: 200 com lista vazia ou filtrada normalmente — NUNCA um 500,
        e a tabela `clientes` deve continuar existindo depois do teste.
        """
        pytest.skip("Implementar com sessão de banco real — ver docstring do módulo.")
