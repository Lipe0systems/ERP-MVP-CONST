"""
Agregador das rotas da API v1.
Camada: Presentation.
"""
from fastapi import APIRouter

from app.presentation.api.v1 import atendimentos, auditoria, auth, banco, busca, clientes, compras, dashboard, diario_obra, documentos, estoque, financeiro, fornecedores, notificacoes, obras, onboarding, orcamentos, recorrencias, relatorios, vendas

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(clientes.router)
api_router.include_router(obras.router)
api_router.include_router(financeiro.router)
api_router.include_router(compras.router)
api_router.include_router(estoque.router)
api_router.include_router(diario_obra.router)
api_router.include_router(orcamentos.router)
api_router.include_router(fornecedores.router)
api_router.include_router(relatorios.router)
api_router.include_router(banco.router)
api_router.include_router(atendimentos.router)
api_router.include_router(documentos.router)
api_router.include_router(vendas.router)
api_router.include_router(auditoria.router)
api_router.include_router(notificacoes.router)
api_router.include_router(busca.router)
api_router.include_router(recorrencias.router)
api_router.include_router(onboarding.router)
