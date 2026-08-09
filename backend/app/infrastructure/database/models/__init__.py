"""
Importa todos os modelos ORM para garantir que estão registrados
no Base do SQLAlchemy antes de qualquer operação de banco.
Sem isso, modelos adicionados após o startup inicial podem não ser
encontrados pelo SQLAlchemy em tempo de execução.
"""
from app.infrastructure.database.models.base import BaseModel, TenantModel
from app.infrastructure.database.models.empresa import EmpresaModel
from app.infrastructure.database.models.usuario import UsuarioModel
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.models.conta_pagar import ContaPagarModel
from app.infrastructure.database.models.conta_receber import ContaReceberModel
from app.infrastructure.database.models.compra import CompraModel
from app.infrastructure.database.models.estoque import ItemEstoqueModel
from app.infrastructure.database.models.diario_obra import RegistroDiarioModel
from app.infrastructure.database.models.orcamento import OrcamentoModel, OrcamentoItemModel
from app.infrastructure.database.models.atendimento import AtendimentoModel
from app.infrastructure.database.models.convite import ConviteUsuarioModel
from app.infrastructure.database.models.historico_preco import HistoricoPrecoEstoqueModel
from app.infrastructure.database.models.recorrencia import RecorrenciaFinanceiraModel
from app.infrastructure.database.models.auditoria import RegistroAuditoriaModel
from app.infrastructure.database.models.venda import VendaModel, ParcelaVendaModel
from app.infrastructure.database.models.banco import ContaBancariaModel, LancamentoBancarioModel
from app.infrastructure.database.models.documento import DocumentoModel
from app.infrastructure.database.models.fornecedor import FornecedorModel

__all__ = [
    "BaseModel", "TenantModel",
    "EmpresaModel", "UsuarioModel",
    "ClienteModel", "ObraModel",
    "ContaPagarModel", "ContaReceberModel",
    "CompraModel", "ItemEstoqueModel",
    "RegistroDiarioModel",
    "OrcamentoModel", "OrcamentoItemModel",
    "AtendimentoModel",
    "ConviteUsuarioModel",
    "HistoricoPrecoEstoqueModel",
    "RecorrenciaFinanceiraModel",
    "RegistroAuditoriaModel",
    "VendaModel", "ParcelaVendaModel",
    "ContaBancariaModel", "LancamentoBancarioModel",
    "DocumentoModel",
    "FornecedorModel",
]
