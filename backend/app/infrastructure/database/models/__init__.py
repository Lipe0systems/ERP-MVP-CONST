"""
Importa todos os modelos ORM para garantir que estão registrados
no Base do SQLAlchemy antes de qualquer operação de banco.
"""
from app.infrastructure.database.models.base import BaseModel, TenantModel
from app.infrastructure.database.models.empresa import EmpresaModel
from app.infrastructure.database.models.usuario import UsuarioModel
from app.infrastructure.database.models.cliente import ClienteModel
from app.infrastructure.database.models.obra import ObraModel
from app.infrastructure.database.models.conta_pagar import ContaPagarModel
from app.infrastructure.database.models.conta_receber import ContaReceberModel
from app.infrastructure.database.models.compra import CompraModel
from app.infrastructure.database.models.estoque import EstoqueModel
from app.infrastructure.database.models.diario_obra import DiarioObraModel
from app.infrastructure.database.models.orcamento import OrcamentoModel, OrcamentoItemModel
from app.infrastructure.database.models.fornecedor import FornecedorModel

__all__ = [
    "BaseModel", "TenantModel",
    "EmpresaModel", "UsuarioModel",
    "ClienteModel", "ObraModel",
    "ContaPagarModel", "ContaReceberModel",
    "CompraModel", "EstoqueModel",
    "DiarioObraModel",
    "OrcamentoModel", "OrcamentoItemModel",
    "FornecedorModel",
]
