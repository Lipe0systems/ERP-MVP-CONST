"""
Serviço de Auditoria — registra ações nos módulos críticos.

Design: best-effort e não-bloqueante. Se o log falhar por qualquer motivo
(DB momentaneamente fora, lock timeout etc.), a ação do usuário NÃO é
revertida — apenas logamos o erro no stderr. Isso garante que a auditoria
nunca interfere na operação normal do sistema.

Como usar nos endpoints:
    from app.application.services.auditoria_service import registrar

    registrar(db, current_user, "orcamentos", AcaoAuditoria.APROVOU,
              str(orcamento.id), f"Orçamento #{orcamento.numero} aprovado")
"""
import logging
import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.domain.entities.auditoria import AcaoAuditoria
from app.infrastructure.database.models.auditoria import RegistroAuditoriaModel

logger = logging.getLogger("auditoria")


def registrar(
    db: Session,
    usuario: CurrentUser,
    modulo: str,
    acao: AcaoAuditoria,
    entidade_id: str,
    descricao: str,
    dados_anteriores: dict | None = None,
    dados_novos: dict | None = None,
) -> None:
    """Grava um registro de auditoria. Nunca lança exceção para o chamador."""
    try:
        registro = RegistroAuditoriaModel(
            id=uuid.uuid4(),
            empresa_id=usuario.empresa_id,
            usuario_id=usuario.id,
            usuario_email=usuario.email or "",
            modulo=modulo,
            acao=acao.value,
            entidade_id=entidade_id,
            descricao=descricao,
            dados_anteriores=dados_anteriores,
            dados_novos=dados_novos,
            criado_em=datetime.utcnow(),
        )
        db.add(registro)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        # Nunca bloqueia a operação principal — só loga o erro
        try:
            db.rollback()
        except Exception:
            pass
        logger.error("Falha ao registrar auditoria: %s | %s | %s | %s — %s",
                     modulo, acao.value, entidade_id, descricao, exc)
