"""
Endpoints de Backup e Exportação (D3).

  GET  /backup/modulos            → lista módulos exportáveis (para a UI)
  POST /backup/exportar           → gera Excel, CSV(zip) ou JSON conforme escolha
  GET  /backup/completo           → backup JSON de tudo (atalho restaurável)

O arquivo é retornado como download (StreamingResponse).
Camada: Presentation.
"""
from __future__ import annotations

import io
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import get_empresa_id
from app.infrastructure.database.session import get_db
from app.application.services import backup_service

router = APIRouter(prefix="/backup", tags=["Backup e Exportação"])


class ExportarIn(BaseModel):
    formato: str = Field(default="excel")  # excel | csv | json
    modulos: list[str] = Field(default_factory=list)  # vazio = todos
    incluir_arquivos: bool = Field(default=False)  # anexa documentos do Storage num .zip


@router.get("/modulos")
def listar_modulos():
    """Lista os módulos que podem ser exportados (para a página de Backup)."""
    return backup_service.modulos_disponiveis()


@router.post("/exportar")
def exportar(
    body: ExportarIn,
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    # Se nenhum módulo for escolhido, exporta todos
    todos = [m["chave"] for m in backup_service.modulos_disponiveis()]
    modulos = body.modulos or todos
    hoje = date.today().isoformat()

    # Se pediu para incluir os arquivos, sempre devolve um .zip (dados + documentos/)
    # JSON não combina com arquivos binários — nesses casos usamos Excel para os dados.
    if body.incluir_arquivos:
        formato_dados = "csv" if body.formato == "csv" else "excel"
        conteudo = backup_service.gerar_backup_com_arquivos(db, empresa_id, modulos, formato_dados)
        return StreamingResponse(
            io.BytesIO(conteudo),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="construtec-backup-completo-{hoje}.zip"'},
        )

    if body.formato == "csv":
        conteudo = backup_service.gerar_csv_zip(db, empresa_id, modulos)
        return StreamingResponse(
            io.BytesIO(conteudo),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="construtec-export-{hoje}.zip"'},
        )

    if body.formato == "json":
        conteudo = backup_service.gerar_backup_json(db, empresa_id)
        return StreamingResponse(
            io.BytesIO(conteudo),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="construtec-backup-{hoje}.json"'},
        )

    # padrão: excel
    conteudo = backup_service.gerar_excel(db, empresa_id, modulos)
    return StreamingResponse(
        io.BytesIO(conteudo),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="construtec-export-{hoje}.xlsx"'},
    )


@router.get("/completo")
def backup_completo(
    empresa_id: UUID = Depends(get_empresa_id),
    db: Session = Depends(get_db),
):
    """Atalho: backup JSON completo de todas as tabelas (restaurável)."""
    conteudo = backup_service.gerar_backup_json(db, empresa_id)
    hoje = date.today().isoformat()
    return StreamingResponse(
        io.BytesIO(conteudo),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="construtec-backup-completo-{hoje}.json"'},
    )
