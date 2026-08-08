"""
Entidade de domínio: ItemEstoque, sempre vinculado a uma Empresa (tenant).
Camada: Domain — regras de negócio puras, sem dependências externas.
"""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class ItemEstoque:
    id: UUID
    empresa_id: UUID
    produto: str
    quantidade: float
    valor_medio: float
    unidade: str | None = None
    estoque_minimo: float | None = None
    observacoes: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)

    @property
    def valor_total(self) -> float:
        """
        Deliberadamente NÃO armazenado — sempre quantidade × valor_médio,
        mesmo princípio já aplicado em Compras (valor_total) e Financeiro
        (esta_atrasada): nunca guardar o que pode ser derivado.
        """
        return round(self.quantidade * self.valor_medio, 2)
