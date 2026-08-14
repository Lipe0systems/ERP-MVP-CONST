"""
Endpoints da Lixeira (Soft Delete — V4).

  GET    /lixeira                    → conta itens na lixeira por módulo
  GET    /lixeira/{modulo}           → lista itens deletados de um módulo
  POST   /lixeira/{modulo}/{id}/restaurar   → tira da lixeira
  DELETE /lixeira/{modulo}/{id}      → apaga DE VEZ (permanente)
  POST   /lixeira/expurgar           → apaga permanentemente tudo com +30 dias

Só enxerga itens da própria empresa. Usa with_deleted() para driblar o
filtro global de soft delete.
Camada: Presentation.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id, exigir_admin
from app.infrastructure.database.session import get_db
from app.infrastructure.database.soft_delete import with_deleted, only_deleted

from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.models.fornecedor import FornecedorModel
from app.infrastructure.database.models.orcamento import OrcamentoModel
from app.infrastructure.database.models.venda import VendaModel
from app.infrastructure.database.models.compra import CompraModel
from app.infrastructure.database.models.estoque import ItemEstoqueModel
from app.infrastructure.database.models.conta_pagar import ContaPagarModel
from app.infrastructure.database.models.conta_receber import ContaReceberModel
from app.infrastructure.database.models.banco import ContaBancariaModel
from app.infrastructure.database.models.atendimento import AtendimentoModel
from app.infrastructure.database.models.diario_obra import RegistroDiarioModel
from app.infrastructure.database.models.documento import DocumentoModel
from app.infrastructure.database.models.funcionario import FuncionarioModel

router = APIRouter(prefix="/lixeira", tags=["Lixeira"])

DIAS_EXPURGO = 30

# Módulos com lixeira: chave -> (label, model, campo para exibir como "nome")
MODULOS = {
    "clientes": ("Clientes", ClienteModel, "nome"),
    "obras": ("Obras", ObraModel, "nome"),
    "fornecedores": ("Fornecedores", FornecedorModel, "nome"),
    "orcamentos": ("Orçamentos", OrcamentoModel, "numero"),
    "vendas": ("Vendas", VendaModel, "numero"),
    "compras": ("Compras", CompraModel, "produto"),
    "estoque": ("Estoque", ItemEstoqueModel, "produto"),
    "contas_pagar": ("Contas a Pagar", ContaPagarModel, "descricao"),
    "contas_receber": ("Contas a Receber", ContaReceberModel, "descricao"),
    "contas_bancarias": ("Contas Bancárias", ContaBancariaModel, "nome"),
    "atendimentos": ("Atendimentos", AtendimentoModel, "tipo"),
    "diario_obra": ("Diário de Obra", RegistroDiarioModel, "observacoes"),
    "documentos": ("Documentos", DocumentoModel, "nome"),
    "funcionarios": ("Funcionários", FuncionarioModel, "nome"),
}


def _label_registro(model_obj, campo: str) -> str:
    val = getattr(model_obj, campo, None)
    if val is None:
        return "(sem título)"
    if campo == "numero":
        return f"Nº {val}"
    return str(val)


@router.get("")
def resumo_lixeira(empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    """Conta quantos itens estão na lixeira, por módulo."""
    resultado = []
    total = 0
    for chave, (label, model, _campo) in MODULOS.items():
        q = only_deleted(db.query(model), model)
        if hasattr(model, "empresa_id"):
            q = q.filter(model.empresa_id == empresa_id)
        n = q.count()
        total += n
        if n > 0:
            resultado.append({"modulo": chave, "label": label, "quantidade": n})
    return {"total": total, "modulos": resultado, "dias_expurgo": DIAS_EXPURGO}


@router.get("/{modulo}")
def listar_deletados(modulo: str, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    if modulo not in MODULOS:
        raise HTTPException(404, "Módulo inválido.")
    label, model, campo = MODULOS[modulo]
    q = only_deleted(db.query(model), model)
    if hasattr(model, "empresa_id"):
        q = q.filter(model.empresa_id == empresa_id)
    q = q.order_by(model.deletado_em.desc())

    itens = []
    for m in q.all():
        dias_restantes = DIAS_EXPURGO - (datetime.utcnow() - m.deletado_em).days
        itens.append({
            "id": str(m.id),
            "titulo": _label_registro(m, campo),
            "deletado_em": m.deletado_em.isoformat(),
            "dias_restantes": max(0, dias_restantes),
        })
    return {"modulo": modulo, "label": label, "itens": itens}


@router.post("/{modulo}/{item_id}/restaurar", status_code=200)
def restaurar_item(modulo: str, item_id: UUID, empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db)):
    if modulo not in MODULOS:
        raise HTTPException(404, "Módulo inválido.")
    _label, model, _campo = MODULOS[modulo]
    q = with_deleted(db.query(model)).filter(model.id == item_id)
    if hasattr(model, "empresa_id"):
        q = q.filter(model.empresa_id == empresa_id)
    m = q.first()
    if not m:
        raise HTTPException(404, "Item não encontrado na lixeira.")
    m.deletado_em = None
    db.commit()
    return {"restaurado": True}


@router.delete("/{modulo}/{item_id}", status_code=204)
def apagar_definitivo(
    modulo: str, item_id: UUID,
    empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db),
    _admin=Depends(exigir_admin),
):
    """Apaga o item DE VEZ (irreversível)."""
    if modulo not in MODULOS:
        raise HTTPException(404, "Módulo inválido.")
    _label, model, _campo = MODULOS[modulo]
    q = with_deleted(db.query(model)).filter(model.id == item_id)
    if hasattr(model, "empresa_id"):
        q = q.filter(model.empresa_id == empresa_id)
    m = q.first()
    if not m:
        raise HTTPException(404, "Item não encontrado na lixeira.")
    db.delete(m)  # hard delete real
    db.commit()


@router.post("/expurgar")
def expurgar_antigos(
    empresa_id: UUID = Depends(get_empresa_id), db: Session = Depends(get_db),
    _admin=Depends(exigir_admin),
):
    """
    Apaga permanentemente todos os itens que estão na lixeira há mais de 30 dias.
    Pode ser chamado manualmente ou por um agendador (cron).
    """
    limite = datetime.utcnow() - timedelta(days=DIAS_EXPURGO)
    total_apagados = 0
    for chave, (_label, model, _campo) in MODULOS.items():
        q = only_deleted(db.query(model), model).filter(model.deletado_em < limite)
        if hasattr(model, "empresa_id"):
            q = q.filter(model.empresa_id == empresa_id)
        antigos = q.all()
        for m in antigos:
            db.delete(m)
            total_apagados += 1
    db.commit()
    return {"apagados": total_apagados}
