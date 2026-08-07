"""
Entidade de domínio: Documento.
Um documento pode ser vinculado a um Cliente, Obra ou Orçamento.
Camada: Domain.
"""
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Documento:
    id: UUID
    empresa_id: UUID
    nome: str               # nome de exibição (ex.: "Contrato assinado")
    arquivo_url: str        # URL assinada ou pública no Supabase Storage
    arquivo_nome: str       # nome original do arquivo (ex.: "contrato.pdf")
    arquivo_tipo: str       # MIME type (ex.: "application/pdf")
    arquivo_tamanho: int    # bytes
    # Vínculos opcionais — ao menos um deve estar preenchido
    cliente_id: UUID | None = None
    obra_id: UUID | None = None
    orcamento_id: UUID | None = None
    descricao: str | None = None
    criado_em: datetime = field(default_factory=datetime.utcnow)
