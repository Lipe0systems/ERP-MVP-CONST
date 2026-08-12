"""
Endpoints REST do módulo Orçamentos.
Camada: Presentation.
"""
from uuid import UUID
from datetime import date
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.application.use_cases.orcamento_use_cases import OrcamentoUseCases
from app.core.security import get_empresa_id, get_current_user, CurrentUser
from app.application.services.auditoria_service import registrar as audit
from app.domain.entities.auditoria import AcaoAuditoria
from app.domain.entities.orcamento import StatusOrcamento
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository
from app.infrastructure.repositories.conta_receber_repository import SqlAlchemyContaReceberRepository
from app.infrastructure.repositories.estoque_repository import SqlAlchemyEstoqueRepository
from app.infrastructure.repositories.obra_repository import SqlAlchemyObraRepository
from app.infrastructure.repositories.orcamento_repository import SqlAlchemyOrcamentoRepository
from app.domain.entities.obra import Obra, ObraStatus
from app.presentation.schemas.orcamento import (
    AprovarLoteIn,
    OrcamentoCreateIn,
    OrcamentoListOut,
    OrcamentoOut,
    OrcamentoItemOut,
    OrcamentoUpdateIn,
)

router = APIRouter(prefix="/orcamentos", tags=["Orçamentos"])


def _get_use_cases(db: Session = Depends(get_db)) -> OrcamentoUseCases:
    return OrcamentoUseCases(
        repository=SqlAlchemyOrcamentoRepository(db),
        cliente_repository=SqlAlchemyClienteRepository(db),
        obra_repository=SqlAlchemyObraRepository(db),
        estoque_repository=SqlAlchemyEstoqueRepository(db),
        conta_receber_repository=SqlAlchemyContaReceberRepository(db),
    )


def _entity_to_out(orc) -> OrcamentoOut:
    return OrcamentoOut(
        id=orc.id,
        numero=orc.numero,
        cliente_id=orc.cliente_id,
        obra_id=orc.obra_id,
        status=orc.status,
        validade=orc.validade,
        observacoes=orc.observacoes,
        conta_receber_id=orc.conta_receber_id,
        criado_em=orc.criado_em,
        itens=[
            OrcamentoItemOut(
                id=i.id,
                descricao=i.descricao,
                quantidade=i.quantidade,
                valor_unitario=i.valor_unitario,
                unidade=i.unidade,
                estoque_id=i.estoque_id,
            )
            for i in orc.itens
        ],
    )


@router.get("", response_model=OrcamentoListOut)
def listar_orcamentos(
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
    search: str | None = None,
    status: StatusOrcamento | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    items, total = use_cases.listar(empresa_id, search, status, page, page_size)
    return OrcamentoListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/{orcamento_id}", response_model=OrcamentoOut)
def obter_orcamento(
    orcamento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
):
    return _entity_to_out(use_cases.obter(empresa_id, orcamento_id))


@router.post("", response_model=OrcamentoOut, status_code=201)
def criar_orcamento(
    body: OrcamentoCreateIn,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
):
    orc = use_cases.criar(
        empresa_id=empresa_id,
        cliente_id=body.cliente_id,
        obra_id=body.obra_id,
        validade=body.validade,
        observacoes=body.observacoes,
        itens=[item.model_dump() for item in body.itens],
    )
    return _entity_to_out(orc)


@router.put("/{orcamento_id}", response_model=OrcamentoOut)
def atualizar_orcamento(
    orcamento_id: UUID,
    body: OrcamentoUpdateIn,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
):
    orc = use_cases.atualizar(
        empresa_id=empresa_id,
        orcamento_id=orcamento_id,
        cliente_id=body.cliente_id,
        obra_id=body.obra_id,
        validade=body.validade,
        observacoes=body.observacoes,
        itens=[item.model_dump() for item in body.itens],
    )
    return _entity_to_out(orc)


@router.post("/{orcamento_id}/aprovar", response_model=OrcamentoOut)
def aprovar_orcamento(
    orcamento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    orc = use_cases.aprovar(empresa_id, orcamento_id)
    audit(db, current_user, "orcamentos", AcaoAuditoria.APROVOU,
          str(orcamento_id), f"Orcamento #{orc.numero} aprovado")
    return _entity_to_out(orc)


@router.post("/aprovar-em-lote")
def aprovar_orcamentos_em_lote(
    body: AprovarLoteIn,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Aprova múltiplos orçamentos de uma vez. Cada um segue a mesma regra de
    negócio do endpoint individual (baixa de estoque + conta a receber).
    Não interrompe no primeiro erro — processa todos e retorna um resumo
    com sucessos e falhas, para que o usuário veja exatamente o que passou.
    """
    sucesso: list[dict] = []
    falha: list[dict] = []

    for orcamento_id in body.orcamento_ids:
        try:
            orc = use_cases.aprovar(empresa_id, orcamento_id)
            audit(db, current_user, "orcamentos", AcaoAuditoria.APROVOU,
                  str(orcamento_id), f"Orcamento #{orc.numero} aprovado (lote)")
            sucesso.append({"id": str(orcamento_id), "numero": orc.numero})
        except Exception as exc:  # noqa: BLE001
            detail = getattr(exc, "detail", str(exc))
            falha.append({"id": str(orcamento_id), "erro": detail})

    return {"aprovados": sucesso, "falhas": falha}


@router.post("/{orcamento_id}/recusar", response_model=OrcamentoOut)
def recusar_orcamento(
    orcamento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
):
    return _entity_to_out(use_cases.recusar(empresa_id, orcamento_id))


@router.post("/{orcamento_id}/cancelar", response_model=OrcamentoOut)
def cancelar_orcamento(
    orcamento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    orc = use_cases.cancelar(empresa_id, orcamento_id)
    audit(db, current_user, "orcamentos", AcaoAuditoria.CANCELOU,
          str(orcamento_id), f"Orcamento #{orc.numero} cancelado")
    return _entity_to_out(orc)


@router.delete("/{orcamento_id}", status_code=204)
def remover_orcamento(
    orcamento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
):
    use_cases.remover(empresa_id, orcamento_id)


@router.get("/{orcamento_id}/pdf")
def gerar_pdf(
    orcamento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
    db: Session = Depends(get_db),
):
    """Gera e retorna o PDF do orçamento para download."""
    from fastapi.responses import Response

    from app.application.services.pdf_orcamento import gerar_pdf_orcamento
    from app.infrastructure.repositories.cliente_repository import SqlAlchemyClienteRepository

    orc = use_cases.obter(empresa_id, orcamento_id)
    cliente_repo = SqlAlchemyClienteRepository(db)
    cliente = cliente_repo.get_by_id(empresa_id, orc.cliente_id)

    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente do orçamento não encontrado.",
        )

    pdf_bytes = gerar_pdf_orcamento(orc, cliente)

    filename = f"orcamento_{orc.numero:04d}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )

# ═══ V4 — Integração: Orçamento → Obra ══════════════════════════════════════

class _CriarObraIn(BaseModel):
    """Payload opcional para customizar a obra criada a partir do orçamento."""
    nome: str | None = None
    endereco: str | None = None
    responsavel: str | None = None
    data_inicio: date | None = None
    data_previsao: date | None = None


@router.post("/{orcamento_id}/criar-obra")
def criar_obra_a_partir_do_orcamento(
    orcamento_id: UUID,
    body: _CriarObraIn = _CriarObraIn(),
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    use_cases: OrcamentoUseCases = Depends(_get_use_cases),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Cria uma Obra a partir de um orçamento aprovado, reaproveitando cliente,
    valor contratado e prazo. Também cria o Orçamento-base da obra (snapshot
    do previsto). Se o orçamento já estiver vinculado a uma obra, retorna
    essa obra existente em vez de criar uma nova (evita duplicidade).
    """
    orc = use_cases.obter(empresa_id, orcamento_id)

    if orc.status != StatusOrcamento.APROVADO:
        raise HTTPException(422, "Só é possível criar obra a partir de um orçamento aprovado.")

    obra_repo = SqlAlchemyObraRepository(db)

    # Já existe obra vinculada a este orçamento? Não duplica.
    if orc.obra_id:
        obra_existente = obra_repo.get_by_id(empresa_id, orc.obra_id)
        if obra_existente:
            return {
                "criada": False,
                "obra_id": str(obra_existente.id),
                "obra_nome": obra_existente.nome,
                "mensagem": "Este orçamento já está vinculado a uma obra existente.",
            }

    import uuid as _uuid
    nova_obra = Obra(
        id=_uuid.uuid4(),
        empresa_id=empresa_id,
        nome=body.nome or f"Obra — Orçamento #{orc.numero:04d}",
        cliente_id=orc.cliente_id,
        endereco=body.endereco,
        responsavel=body.responsavel,
        data_inicio=body.data_inicio,
        data_previsao=body.data_previsao or orc.validade,
        status=ObraStatus.PLANEJAMENTO,
        valor_previsto=orc.valor_total,
        orcamento_origem_id=orc.id,
    )
    obra_criada = obra_repo.create(nova_obra)

    # Vincula o orçamento comercial à obra recém-criada (preserva o orçamento
    # original intacto — atualiza só a coluna obra_id, sem tocar nos itens).
    from app.infrastructure.database.models.orcamento import OrcamentoModel as _OrcModel
    db.query(_OrcModel).filter(
        _OrcModel.empresa_id == empresa_id, _OrcModel.id == orcamento_id
    ).update({"obra_id": obra_criada.id})
    db.commit()

    # Cria o Orçamento-base da obra (snapshot do previsto — Fluxo 2)
    from app.infrastructure.database.models.orcamento_base_obra import OrcamentoBaseObraModel
    base = OrcamentoBaseObraModel(
        id=_uuid.uuid4(),
        empresa_id=empresa_id,
        obra_id=obra_criada.id,
        orcamento_origem_id=orc.id,
        valor_previsto=orc.valor_total,
        descricao=f"Gerado automaticamente do orçamento #{orc.numero:04d}.",
    )
    db.add(base)
    db.commit()

    # Auditoria (best-effort — não bloqueia a operação principal)
    try:
        audit(
            db, usuario=current_user, modulo="obras",
            acao=AcaoAuditoria.CRIOU,
            entidade_id=str(obra_criada.id),
            descricao=f"Obra criada a partir do orçamento #{orc.numero:04d}.",
        )
    except Exception:
        pass

    return {
        "criada": True,
        "obra_id": str(obra_criada.id),
        "obra_nome": obra_criada.nome,
        "valor_previsto": obra_criada.valor_previsto,
        "mensagem": "Obra criada com sucesso a partir do orçamento.",
    }
