"""
Endpoints do Workspace Comercial (V4).

Este router NÃO contém lógica de negócio nova — ele orquestra os use cases
já existentes de Clientes, Orçamentos e Vendas, e mantém um registro de
"processo" que rastreia em que fase o usuário está. A criação real de
cliente/orçamento/venda continua 100% delegada aos módulos existentes.

Fases: cliente → orcamento → proposta → venda → obra → concluido
Camada: Presentation.
"""
from __future__ import annotations

import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id, get_current_user, CurrentUser
from app.application.services.auditoria_service import registrar as audit
from app.domain.entities.auditoria import AcaoAuditoria
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models.processo_comercial import ProcessoComercialModel
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.orcamento import OrcamentoModel
from app.infrastructure.database.models.venda import VendaModel
from app.infrastructure.database.models.obra import ObraModel
from app.presentation.schemas.workspace import ProcessoComercialCreate, ProcessoComercialOut

router = APIRouter(prefix="/workspace", tags=["Workspace Comercial"])


def _enriquecer(db: Session, empresa_id: UUID, p: ProcessoComercialModel) -> dict:
    """Monta o retorno já com os dados relacionados, evitando N+1 no frontend."""
    d = ProcessoComercialOut.model_validate(p).model_dump()

    if p.cliente_id:
        c = db.query(ClienteModel).filter(
            ClienteModel.empresa_id == empresa_id, ClienteModel.id == p.cliente_id
        ).first()
        d["cliente_nome"] = c.nome if c else None

    if p.orcamento_id:
        o = db.query(OrcamentoModel).filter(
            OrcamentoModel.empresa_id == empresa_id, OrcamentoModel.id == p.orcamento_id
        ).first()
        if o:
            d["orcamento_numero"] = o.numero
            d["orcamento_status"] = o.status
            # valor_total é uma property calculada a partir dos itens no domínio;
            # aqui usamos soma direta dos itens do model para não acoplar ao use case.
            d["orcamento_valor_total"] = sum(
                float(i.quantidade) * float(i.valor_unitario) for i in o.itens
            )

    if p.venda_id:
        v = db.query(VendaModel).filter(
            VendaModel.empresa_id == empresa_id, VendaModel.id == p.venda_id
        ).first()
        d["venda_numero"] = v.numero if v else None

    if p.obra_id:
        ob = db.query(ObraModel).filter(
            ObraModel.empresa_id == empresa_id, ObraModel.id == p.obra_id
        ).first()
        d["obra_nome"] = ob.nome if ob else None

    return d


@router.get("")
def listar_processos(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    apenas_em_andamento: bool = True,
):
    """Lista os processos comerciais — usado na tela inicial do Workspace."""
    q = db.query(ProcessoComercialModel).filter(ProcessoComercialModel.empresa_id == empresa_id)
    if apenas_em_andamento:
        q = q.filter(ProcessoComercialModel.fase != "concluido")
    rows = q.order_by(ProcessoComercialModel.criado_em.desc()).all()
    return [_enriquecer(db, empresa_id, p) for p in rows]


@router.get("/{processo_id}")
def obter_processo(
    processo_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    """
    Retorna o estado atual do processo — é isso que a tela do Workspace
    consulta ao carregar/retomar (Fase 36/37 do documento: "continuar de
    onde parou").
    """
    p = db.query(ProcessoComercialModel).filter(
        ProcessoComercialModel.empresa_id == empresa_id, ProcessoComercialModel.id == processo_id
    ).first()
    if not p:
        raise HTTPException(404, "Processo não encontrado.")
    return _enriquecer(db, empresa_id, p)


@router.post("", status_code=201)
def iniciar_processo(
    body: ProcessoComercialCreate,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Inicia um novo processo comercial (Novo Projeto). Se já vier com um
    cliente_id (cliente existente selecionado), o processo nasce direto
    na fase 'orcamento'; senão, começa em 'cliente'.
    """
    p = ProcessoComercialModel(
        id=uuid.uuid4(),
        empresa_id=empresa_id,
        nome=body.nome,
        cliente_id=body.cliente_id,
        fase="orcamento" if body.cliente_id else "cliente",
        criado_por_id=current_user.id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    try:
        audit(db, usuario=current_user, modulo="workspace", acao=AcaoAuditoria.CRIOU,
              entidade_id=str(p.id), descricao=f"Processo comercial iniciado: {p.nome or p.id}.")
    except Exception:
        pass

    return _enriquecer(db, empresa_id, p)


@router.patch("/{processo_id}/vincular-cliente")
def vincular_cliente(
    processo_id: UUID,
    cliente_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Vincula um cliente (novo ou existente — já criado via módulo Clientes)
    ao processo e avança para a fase 'orcamento'. A criação do cliente em
    si acontece pelo endpoint normal de POST /clientes; aqui só registramos
    a escolha no processo.
    """
    p = db.query(ProcessoComercialModel).filter(
        ProcessoComercialModel.empresa_id == empresa_id, ProcessoComercialModel.id == processo_id
    ).first()
    if not p:
        raise HTTPException(404, "Processo não encontrado.")

    cliente = db.query(ClienteModel).filter(
        ClienteModel.empresa_id == empresa_id, ClienteModel.id == cliente_id
    ).first()
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado.")

    p.cliente_id = cliente_id
    if p.fase == "cliente":
        p.fase = "orcamento"
    db.commit()
    db.refresh(p)

    try:
        audit(db, usuario=current_user, modulo="workspace", acao=AcaoAuditoria.EDITOU,
              entidade_id=str(p.id), descricao=f"Cliente vinculado ao processo: {cliente.nome}.")
    except Exception:
        pass

    return _enriquecer(db, empresa_id, p)


@router.patch("/{processo_id}/vincular-orcamento")
def vincular_orcamento(
    processo_id: UUID,
    orcamento_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Vincula um orçamento (criado pelo módulo Orçamentos normal) ao processo
    e avança para 'proposta'. Reaproveita o PDF já existente do orçamento
    como a "Proposta" — nenhum gerador de PDF novo é criado.
    """
    p = db.query(ProcessoComercialModel).filter(
        ProcessoComercialModel.empresa_id == empresa_id, ProcessoComercialModel.id == processo_id
    ).first()
    if not p:
        raise HTTPException(404, "Processo não encontrado.")

    orc = db.query(OrcamentoModel).filter(
        OrcamentoModel.empresa_id == empresa_id, OrcamentoModel.id == orcamento_id
    ).first()
    if not orc:
        raise HTTPException(404, "Orçamento não encontrado.")

    p.orcamento_id = orcamento_id
    if p.fase in ("cliente", "orcamento"):
        p.fase = "proposta"
    db.commit()
    db.refresh(p)

    try:
        audit(db, usuario=current_user, modulo="workspace", acao=AcaoAuditoria.EDITOU,
              entidade_id=str(p.id), descricao=f"Orçamento #{orc.numero} vinculado ao processo.")
    except Exception:
        pass

    return _enriquecer(db, empresa_id, p)


@router.patch("/{processo_id}/avancar-para-venda")
def avancar_para_venda(
    processo_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    """
    Marca que a proposta foi aceita internamente e o processo está pronto
    para gerar a venda (Fase 'venda'). A venda em si é criada pelo endpoint
    normal POST /vendas/de-orcamento — aqui só avançamos a fase.
    """
    p = db.query(ProcessoComercialModel).filter(
        ProcessoComercialModel.empresa_id == empresa_id, ProcessoComercialModel.id == processo_id
    ).first()
    if not p:
        raise HTTPException(404, "Processo não encontrado.")
    if not p.orcamento_id:
        raise HTTPException(422, "O processo ainda não tem um orçamento vinculado.")

    orc = db.query(OrcamentoModel).filter(OrcamentoModel.id == p.orcamento_id).first()
    if orc and orc.status != "aprovado":
        raise HTTPException(422, "O orçamento precisa estar aprovado antes de gerar a venda.")

    p.fase = "venda"
    db.commit()
    db.refresh(p)
    return _enriquecer(db, empresa_id, p)


@router.patch("/{processo_id}/vincular-venda")
def vincular_venda(
    processo_id: UUID,
    venda_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Vincula a venda (criada pelo módulo Vendas normal, via /vendas/de-orcamento)
    ao processo e avança para 'obra'.
    """
    p = db.query(ProcessoComercialModel).filter(
        ProcessoComercialModel.empresa_id == empresa_id, ProcessoComercialModel.id == processo_id
    ).first()
    if not p:
        raise HTTPException(404, "Processo não encontrado.")

    venda = db.query(VendaModel).filter(
        VendaModel.empresa_id == empresa_id, VendaModel.id == venda_id
    ).first()
    if not venda:
        raise HTTPException(404, "Venda não encontrada.")

    p.venda_id = venda_id
    p.fase = "obra"
    db.commit()
    db.refresh(p)

    try:
        audit(db, usuario=current_user, modulo="workspace", acao=AcaoAuditoria.EDITOU,
              entidade_id=str(p.id), descricao=f"Venda #{venda.numero} vinculada ao processo.")
    except Exception:
        pass

    return _enriquecer(db, empresa_id, p)


@router.patch("/{processo_id}/vincular-obra")
def vincular_obra(
    processo_id: UUID,
    obra_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Vincula a obra (criada pelo endpoint já existente
    POST /orcamentos/{id}/criar-obra) ao processo e conclui o fluxo
    comercial. A partir daqui, o usuário segue para o Workspace da Obra
    (próxima etapa, ainda não implementada).
    """
    p = db.query(ProcessoComercialModel).filter(
        ProcessoComercialModel.empresa_id == empresa_id, ProcessoComercialModel.id == processo_id
    ).first()
    if not p:
        raise HTTPException(404, "Processo não encontrado.")

    obra = db.query(ObraModel).filter(
        ObraModel.empresa_id == empresa_id, ObraModel.id == obra_id
    ).first()
    if not obra:
        raise HTTPException(404, "Obra não encontrada.")

    p.obra_id = obra_id
    p.fase = "concluido"
    db.commit()
    db.refresh(p)

    try:
        audit(db, usuario=current_user, modulo="workspace", acao=AcaoAuditoria.EDITOU,
              entidade_id=str(p.id), descricao=f"Processo comercial concluído — obra {obra.nome} criada.")
    except Exception:
        pass

    return _enriquecer(db, empresa_id, p)


@router.delete("/{processo_id}", status_code=204)
def abandonar_processo(
    processo_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    """
    Remove o processo do Workspace (soft delete — vai para a Lixeira como
    qualquer outra entidade do sistema). NÃO apaga cliente/orçamento/venda
    já criados — eles continuam existindo normalmente nos módulos.
    """
    from app.infrastructure.database.soft_delete import soft_delete

    p = db.query(ProcessoComercialModel).filter(
        ProcessoComercialModel.empresa_id == empresa_id, ProcessoComercialModel.id == processo_id
    ).first()
    if not p:
        raise HTTPException(404, "Processo não encontrado.")
    soft_delete(db, p)
