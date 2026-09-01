"""
Configuração da conexão com o banco (SQLAlchemy + Supabase Postgres).
Camada: Infrastructure.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# Pool dimensionado para o cenário real deste deploy:
#   • Render (plano atual) roda 1 worker Uvicorn — não há N processos
#     disputando conexões, então um pool enorme não traria ganho.
#   • DATABASE_URL aponta para o pooler do Supabase em MODO TRANSAÇÃO
#     (porta 6543): as conexões já são multiplexadas do lado do Supabase,
#     então o papel deste pool é só evitar reabrir conexão a cada request.
#
# pool_pre_ping: testa a conexão antes de usar. Essencial aqui — o pooler
# do Supabase encerra conexões ociosas, e sem isso a primeira request
# depois de um período parado falharia com "connection closed".
#
# pool_recycle (30min): recicla conexões antes que o pooler as derrube por
# tempo de vida, evitando erro intermitente difícil de diagnosticar.
#
# Valores conservadores de propósito: aumentar pool_size sem medir só
# consome slots de conexão do plano do Supabase sem ganho real.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
