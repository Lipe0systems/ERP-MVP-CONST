"""
Agregador das rotas da API v1.
Camada: Presentation.
"""
from fastapi import APIRouter

from app.presentation.api.v1 import auth, banco, clientes, compras, dashboard, diario_obra, estoque, financeiro, fornecedores, obras, onboarding, orcamentos, relatorios

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
api_router.include_router(onboarding.router)
