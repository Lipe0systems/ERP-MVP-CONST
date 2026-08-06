"""
Ponto de entrada da aplicação FastAPI.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.presentation.api.v1.router import api_router

logger = logging.getLogger("uvicorn.error")
settings = get_settings()

app = FastAPI(
    title="Construtec API",
    description="API REST do ERP SaaS multiempresa para construtoras.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Rede de segurança: sem isso, uma exceção não prevista em qualquer rota
    pode gerar uma resposta que não passa pelo CORSMiddleware corretamente,
    e o navegador reporta isso como "bloqueado por CORS" em vez do erro real
    — mascarando a causa verdadeira. Aqui sempre devolvemos um 500 já com
    os cabeçalhos de CORS aplicados, e registramos o erro real nos logs.
    """
    logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor."},
    )


app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
