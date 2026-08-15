"""
Ponto de entrada da aplicação FastAPI.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.presentation.api.v1.router import api_router

# Importa todos os modelos ORM para garantir que estão registrados no Base
# antes de qualquer operação de banco (evita erros de "table not found" em
# módulos adicionados após o startup inicial).
import app.infrastructure.database.models  # noqa: F401

logger = logging.getLogger("uvicorn.error")
settings = get_settings()

if settings.SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        # Amostra de performance baixa — o objetivo aqui é capturar ERROS,
        # não rastrear toda requisição em detalhe (isso consumiria a cota
        # gratuita de 5k eventos/mês muito mais rápido sem necessidade).
        traces_sample_rate=0.1,
        send_default_pii=False,  # nunca envia dados pessoais dos usuários por padrão
    )
    logger.info("Sentry inicializado (ambiente: %s)", settings.ENVIRONMENT)

app = FastAPI(
    title="Construtec API",
    description="API REST do ERP SaaS multiempresa para construtoras.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

def _client_ip(request: Request) -> str:
    """
    Identifica o cliente real para o rate limiting.

    Atrás do proxy do Render, `request.client.host` é sempre o IP do próprio
    proxy — usá-lo faria TODOS os usuários do sistema dividirem um único
    balde de requisições, e poucos usuários simultâneos já causariam 429 em
    tráfego legítimo (o dashboard sozinho dispara várias chamadas por carga,
    e as notificações fazem polling a cada 20s por usuário).

    Por isso lemos o primeiro IP de X-Forwarded-For, que é o cliente real.
    O header é preenchido pelo proxy do Render; em ambiente local, onde ele
    não existe, caímos no comportamento padrão.
    """
    encaminhado = request.headers.get("x-forwarded-for")
    if encaminhado:
        return encaminhado.split(",")[0].strip()
    return get_remote_address(request)


# Rate limiting: limite por IP de cliente aplicado a toda a API, para reduzir
# a superfície de força bruta/enumeração e o custo de endpoints pesados
# (geração de PDF, exportação de backup). O limite é generoso de propósito —
# o objetivo é barrar automação abusiva, não atrapalhar uso normal, que é
# naturalmente intenso (dashboard com vários widgets + polling de
# notificações). Endpoints específicos podem receber limites mais estritos
# individualmente com @limiter.limit("...").
limiter = Limiter(key_func=_client_ip, default_limits=["300/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """
    Headers de segurança aplicados a toda resposta da API.

    Não inclui Content-Security-Policy: essa API só serve JSON/PDF/Excel
    para consumo por fetch() do frontend, nunca renderiza HTML de terceiros
    — o CSP relevante para essa proteção pertence ao Next.js (frontend),
    não a esta API. Uma CSP genérica aqui não protegeria nada a mais e
    poderia quebrar o /docs (Swagger UI) sem necessidade.
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    # HSTS: só faz sentido em produção servida via HTTPS (o Render já força
    # HTTPS por padrão). Evita forçar HTTPS em ambiente local de desenvolvimento.
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

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

    Envia explicitamente para o Sentry (quando configurado): como este
    handler já "trata" a exceção antes dela se propagar, a integração
    automática do Sentry com FastAPI pode não vê-la como "não tratada" —
    por isso a captura manual aqui, garantindo que o erro sempre chega lá.
    """
    if settings.SENTRY_DSN:
        import sentry_sdk
        sentry_sdk.capture_exception(exc)

    logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor."},
    )


app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/_teste-sentry")
async def _teste_sentry():
    """
    ⚠️ TEMPORÁRIO — remover depois de confirmar que o Sentry está capturando
    erros do backend em produção. Não exige login de propósito, pra ser
    fácil de testar só acessando a URL no navegador.
    """
    raise Exception("Teste Sentry backend — pode ignorar, é só verificação.")


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
