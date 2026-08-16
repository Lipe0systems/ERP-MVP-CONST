"""
Gerador de PDF para relatório financeiro da Inovak Serviços.
Inclui: resumo geral, contas a pagar e contas a receber.
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

AMBER = colors.HexColor("#D4940A")
DARK_NAVY = colors.HexColor("#0F172A")
GRAY_TEXT = colors.HexColor("#64748B")
LIGHT_BG = colors.HexColor("#F8FAFC")
BORDER_COLOR = colors.HexColor("#E2E8F0")
GREEN = colors.HexColor("#16A34A")
RED = colors.HexColor("#DC2626")

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")
LOGO_PATH = os.path.join(ASSETS_DIR, "logo-inovak.png")


def _fmt_moeda(valor: float) -> str:
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _fmt_data(d) -> str:
    if d is None:
        return "-"
    if hasattr(d, "date"):
        d = d.date()
    return d.strftime("%d/%m/%Y")


def _status_label(status: str) -> str:
    labels = {"pendente": "Pendente", "liquidado": "Liquidado", "cancelado": "Cancelado"}
    return labels.get(status, status)


def gerar_pdf_financeiro(
    contas_pagar: list,
    contas_receber: list,
    total_pagar: float,
    total_receber: float,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    style_normal = ParagraphStyle("CT_N", parent=styles["Normal"], fontName="Helvetica", fontSize=8, textColor=DARK_NAVY, leading=11)
    style_section = ParagraphStyle("CT_S", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11, textColor=DARK_NAVY, spaceBefore=6 * mm, spaceAfter=3 * mm)
    style_small = ParagraphStyle("CT_Sm", parent=styles["Normal"], fontName="Helvetica", fontSize=7, textColor=GRAY_TEXT, leading=10)

    page_width = A4[0] - 30 * mm

    # === CABEÇALHO ===
    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=45 * mm, height=13 * mm)
        logo.hAlign = "LEFT"
    else:
        logo = Paragraph("<b>Inovak</b>", styles["Title"])

    title_info = Paragraph(
        f"<b>RELATORIO FINANCEIRO</b><br/>"
        f"<font size=8 color='#64748B'>Gerado em {_fmt_data(date.today())}</font>",
        ParagraphStyle("RI", parent=style_normal, alignment=TA_RIGHT, fontSize=13),
    )
    header = Table([[logo, title_info]], colWidths=[page_width * 0.5, page_width * 0.5])
    header.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm)]))
    elements.append(header)

    line = Table([[""]], colWidths=[page_width])
    line.setStyle(TableStyle([("LINEBELOW", (0, 0), (0, 0), 2, AMBER)]))
    elements.append(line)
    elements.append(Spacer(1, 4 * mm))

    # === RESUMO ===
    elements.append(Paragraph("RESUMO", style_section))
    saldo = total_receber - total_pagar
    saldo_color = GREEN if saldo >= 0 else RED

    resumo_data = [
        ["Total a Receber", _fmt_moeda(total_receber)],
        ["Total a Pagar", _fmt_moeda(total_pagar)],
        ["Saldo", _fmt_moeda(saldo)],
    ]
    resumo_table = Table(resumo_data, colWidths=[page_width * 0.6, page_width * 0.4])
    resumo_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TEXTCOLOR", (0, 0), (-1, 1), DARK_NAVY),
        ("TEXTCOLOR", (0, 2), (0, 2), DARK_NAVY),
        ("TEXTCOLOR", (1, 2), (1, 2), saldo_color),
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("FONTSIZE", (0, 2), (-1, 2), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ("LINEABOVE", (0, 2), (-1, 2), 1, BORDER_COLOR),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    elements.append(resumo_table)

    # === CONTAS A RECEBER ===
    if contas_receber:
        elements.append(Paragraph(f"CONTAS A RECEBER ({len(contas_receber)})", style_section))
        cr_data = [["Descricao", "Cliente", "Vencimento", "Status", "Valor"]]
        for c in contas_receber:
            cr_data.append([
                c.descricao[:40], c.cliente_nome or "-",
                _fmt_data(c.data_vencimento), _status_label(c.status),
                _fmt_moeda(float(c.valor)),
            ])

        cw = [page_width * 0.28, page_width * 0.22, page_width * 0.15, page_width * 0.13, page_width * 0.22]
        cr_table = Table(cr_data, colWidths=cw, repeatRows=1)
        n = len(cr_data)
        cr_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK_NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (4, 0), (4, -1), "RIGHT"),
            ("ALIGN", (2, 0), (3, -1), "CENTER"),
            *[("BACKGROUND", (0, i), (-1, i), LIGHT_BG) for i in range(2, n, 2)],
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        ]))
        elements.append(cr_table)

    # === CONTAS A PAGAR ===
    if contas_pagar:
        elements.append(Paragraph(f"CONTAS A PAGAR ({len(contas_pagar)})", style_section))
        cp_data = [["Descricao", "Fornecedor", "Vencimento", "Status", "Valor"]]
        for c in contas_pagar:
            cp_data.append([
                c.descricao[:40], c.fornecedor or "-",
                _fmt_data(c.data_vencimento), _status_label(c.status),
                _fmt_moeda(float(c.valor)),
            ])

        cp_table = Table(cp_data, colWidths=cw, repeatRows=1)
        n2 = len(cp_data)
        cp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK_NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (4, 0), (4, -1), "RIGHT"),
            ("ALIGN", (2, 0), (3, -1), "CENTER"),
            *[("BACKGROUND", (0, i), (-1, i), LIGHT_BG) for i in range(2, n2, 2)],
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        ]))
        elements.append(cp_table)

    # === RODAPÉ ===
    elements.append(Spacer(1, 6 * mm))
    foot_line = Table([[""]], colWidths=[page_width])
    foot_line.setStyle(TableStyle([("LINEBELOW", (0, 0), (0, 0), 0.5, BORDER_COLOR)]))
    elements.append(foot_line)
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph("Inovak Serviços", ParagraphStyle("F", parent=style_small, alignment=TA_CENTER)))

    doc.build(elements)
    result = buffer.getvalue()
    buffer.close()
    return result
