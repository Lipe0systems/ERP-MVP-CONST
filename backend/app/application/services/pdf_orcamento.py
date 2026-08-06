"""
Gerador de PDF para orçamentos da Construtec.
Usa reportlab para criar um documento profissional com:
- Logo no cabeçalho
- Dados do cliente
- Tabela de itens com subtotais
- Total geral
- Observações e condições
"""
import io
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.domain.entities.cliente import Cliente
from app.domain.entities.orcamento import Orcamento

AMBER = colors.HexColor("#D4940A")
DARK_NAVY = colors.HexColor("#0F172A")
GRAY_TEXT = colors.HexColor("#64748B")
LIGHT_BG = colors.HexColor("#F8FAFC")
BORDER_COLOR = colors.HexColor("#E2E8F0")

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")
LOGO_PATH = os.path.join(ASSETS_DIR, "logo-construtec.png")


def _fmt_moeda(valor: float) -> str:
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _fmt_data(d) -> str:
    if d is None:
        return "-"
    if hasattr(d, "date"):
        d = d.date()
    return d.strftime("%d/%m/%Y")


def _fmt_documento(doc: str) -> str:
    if len(doc) == 11:
        return f"{doc[:3]}.{doc[3:6]}.{doc[6:9]}-{doc[9:]}"
    if len(doc) == 14:
        return f"{doc[:2]}.{doc[2:5]}.{doc[5:8]}/{doc[8:12]}-{doc[12:]}"
    return doc


def gerar_pdf_orcamento(orcamento: Orcamento, cliente: Cliente) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    style_normal = ParagraphStyle(
        "CT_Normal", parent=styles["Normal"],
        fontName="Helvetica", fontSize=9, textColor=DARK_NAVY, leading=14,
    )
    style_section = ParagraphStyle(
        "CT_Section", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=11, textColor=DARK_NAVY,
        spaceBefore=6 * mm, spaceAfter=3 * mm,
    )
    style_small = ParagraphStyle(
        "CT_Small", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8, textColor=GRAY_TEXT, leading=12,
    )

    page_width = A4[0] - 40 * mm

    # === CABEÇALHO ===
    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=50 * mm, height=15 * mm)
        logo.hAlign = "LEFT"
    else:
        logo = Paragraph("<b>Construtec</b>", styles["Title"])

    orc_info = Paragraph(
        f"<b>ORCAMENTO #{orcamento.numero:04d}</b><br/>"
        f"<font size=8 color='#64748B'>Data: {_fmt_data(orcamento.criado_em)}</font>",
        ParagraphStyle("OrcInfo", parent=style_normal, alignment=TA_RIGHT, fontSize=14),
    )

    header = Table([[logo, orc_info]], colWidths=[page_width * 0.5, page_width * 0.5])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
    ]))
    elements.append(header)

    # Linha divisória âmbar
    line = Table([[""]], colWidths=[page_width])
    line.setStyle(TableStyle([("LINEBELOW", (0, 0), (0, 0), 2, AMBER)]))
    elements.append(line)
    elements.append(Spacer(1, 5 * mm))

    # === DADOS DO CLIENTE ===
    elements.append(Paragraph("DADOS DO CLIENTE", style_section))

    info_rows = [
        ["Nome:", cliente.nome, "Documento:", _fmt_documento(cliente.documento)],
        ["E-mail:", cliente.email or "-", "Telefone:", cliente.telefone or "-"],
    ]
    if cliente.endereco:
        info_rows.append(["Endereco:", cliente.endereco, "", ""])

    cw = page_width / 4
    info_table = Table(info_rows, colWidths=[cw * 0.6, cw * 1.4, cw * 0.6, cw * 1.4])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), GRAY_TEXT),
        ("TEXTCOLOR", (2, 0), (2, -1), GRAY_TEXT),
        ("TEXTCOLOR", (1, 0), (1, -1), DARK_NAVY),
        ("TEXTCOLOR", (3, 0), (3, -1), DARK_NAVY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 1 * mm),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER_COLOR),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    elements.append(info_table)

    if orcamento.validade:
        elements.append(Spacer(1, 2 * mm))
        elements.append(Paragraph(
            f"<b>Validade do orcamento:</b> {_fmt_data(orcamento.validade)}",
            style_small,
        ))

    # === TABELA DE ITENS ===
    elements.append(Paragraph("ITENS DO ORCAMENTO", style_section))

    table_data = [["#", "Descricao", "Qtd", "Unid.", "Valor Unit.", "Subtotal"]]
    for idx, item in enumerate(orcamento.itens, 1):
        subtotal = round(item.quantidade * item.valor_unitario, 2)
        table_data.append([
            str(idx),
            item.descricao,
            f"{item.quantidade:g}",
            item.unidade or "un",
            _fmt_moeda(item.valor_unitario),
            _fmt_moeda(subtotal),
        ])

    table_data.append(["", "", "", "", "TOTAL:", _fmt_moeda(orcamento.valor_total)])

    icw = [
        page_width * 0.06,
        page_width * 0.36,
        page_width * 0.10,
        page_width * 0.08,
        page_width * 0.18,
        page_width * 0.22,
    ]

    n_rows = len(table_data)
    items_table = Table(table_data, colWidths=icw, repeatRows=1)
    items_table.setStyle(TableStyle([
        # Cabeçalho
        ("BACKGROUND", (0, 0), (-1, 0), DARK_NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, 0), 3 * mm),
        # Corpo
        ("FONTNAME", (0, 1), (-1, -2), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -2), 9),
        ("TEXTCOLOR", (0, 1), (-1, -2), DARK_NAVY),
        ("BOTTOMPADDING", (0, 1), (-1, -2), 2.5 * mm),
        ("TOPPADDING", (0, 1), (-1, -2), 2.5 * mm),
        # Alinhamento
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("ALIGN", (3, 0), (3, -1), "CENTER"),
        ("ALIGN", (4, 0), (-1, -1), "RIGHT"),
        # Zebra
        *[("BACKGROUND", (0, i), (-1, i), LIGHT_BG) for i in range(2, n_rows - 1, 2)],
        # Bordas
        ("BOX", (0, 0), (-1, -2), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -2), 0.25, BORDER_COLOR),
        # Total
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 11),
        ("TEXTCOLOR", (4, -1), (-1, -1), DARK_NAVY),
        ("TOPPADDING", (0, -1), (-1, -1), 4 * mm),
        ("LINEABOVE", (4, -1), (-1, -1), 1.5, AMBER),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    elements.append(items_table)

    # === OBSERVAÇÕES ===
    if orcamento.observacoes:
        elements.append(Spacer(1, 4 * mm))
        elements.append(Paragraph("OBSERVACOES", style_section))
        elements.append(Paragraph(orcamento.observacoes, style_normal))

    # === RODAPÉ ===
    elements.append(Spacer(1, 8 * mm))
    foot_line = Table([[""]], colWidths=[page_width])
    foot_line.setStyle(TableStyle([("LINEBELOW", (0, 0), (0, 0), 0.5, BORDER_COLOR)]))
    elements.append(foot_line)
    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph(
        "Construtec - ERP para Construtoras",
        ParagraphStyle("Footer", parent=style_small, alignment=TA_CENTER, textColor=GRAY_TEXT),
    ))

    doc.build(elements)
    result = buffer.getvalue()
    buffer.close()
    return result
