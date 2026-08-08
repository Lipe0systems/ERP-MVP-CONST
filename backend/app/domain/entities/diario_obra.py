"""
Entidade de domínio: RegistroDiario (Diário de Obra), sempre vinculado a uma
Empresa e a uma Obra (vínculo obrigatório, diferente de Compras/Financeiro,
onde a Obra é opcional). Camada: Domain.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class ClimaObra(str, Enum):
    ENSOLARADO = "ensolarado"
    PARCIALMENTE_NUBLADO = "parcialmente_nublado"
    NUBLADO = "nublado"
    CHUVOSO = "chuvoso"
    TEMPESTADE = "tempestade"


MAX_FOTOS_POR_REGISTRO = 10
"""
Única fonte de verdade para o limite de fotos por registro — reutilizada
tanto pela validação estrutural (Pydantic, em presentation/schemas) quanto
pela regra de negócio (use case, em application), evitando que as duas
camadas fiquem com limites diferentes se uma for alterada sem a outra.
"""


@dataclass
class RegistroDiario:
    id: UUID
    empresa_id: UUID
    obra_id: UUID
    data: date
    observacoes: str
    clima: ClimaObra | None = None
    # URLs públicas dos arquivos no Supabase Storage — o backend nunca lida
    # com os bytes da imagem, só com os links; o upload é feito direto do
    # frontend para o Storage (ver docs/DEPLOY.md).
    fotos: list[str] = field(default_factory=list)
    criado_em: datetime = field(default_factory=datetime.utcnow)
