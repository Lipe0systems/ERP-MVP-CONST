"""
Agregador das rotas da API v1.
Camada: Presentation.
"""
from fastapi import APIRouter

from app.presentation.api.v1 import auth, clientes, compras, dashboard, diario_obra, estoque, financeiro, obras, orcamentos

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
