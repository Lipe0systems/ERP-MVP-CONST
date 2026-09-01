"""
Gerador de PDF para relatório consolidado de orçamentos da Onseg Gestão.
Lista todos os orçamentos com totais por status.
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

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")
LOGO_PATH = os.path.join(ASSETS_DIR, "logo-onseg.png")


def _fmt_moeda(valor: float) -> str:
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _fmt_data(d) -> str:
    if d is None:
        return "-"
    if hasattr(d, "date"):
        d = d.date()
    return d.strftime("%d/%m/%Y")


def _status_label(s: str) -> str:
    return {"rascunho": "Rascunho", "aprovado": "Aprovado", "recusado": "Recusado", "cancelado": "Cancelado"}.get(s, s)


def gerar_pdf_orcamentos_relatorio(orcamentos: list[dict], logo_path: str | None = None) -> bytes:
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
    caminho_logo_final = logo_path if logo_path else (LOGO_PATH if os.path.exists(LOGO_PATH) else None)
    if caminho_logo_final:
        logo = Image(caminho_logo_final, width=45 * mm, height=13 * mm)
        logo.hAlign = "LEFT"
    else:
        logo = Paragraph("<b>Onseg</b>", styles["Title"])

    title_info = Paragraph(
        f"<b>RELATORIO DE ORCAMENTOS</b><br/>"
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

    # === RESUMO POR STATUS ===
    elements.append(Paragraph("RESUMO POR STATUS", style_section))
    status_totals: dict[str, tuple[int, float]] = {}
    for orc in orcamentos:
        s = orc["status"]
        count, total = status_totals.get(s, (0, 0.0))
        status_totals[s] = (count + 1, total + orc["valor_total"])

    resumo_data = [["Status", "Qtd", "Valor Total"]]
    grand_total = 0.0
    for s in ["rascunho", "aprovado", "recusado", "cancelado"]:
        if s in status_totals:
            count, total = status_totals[s]
            resumo_data.append([_status_label(s), str(count), _fmt_moeda(total)])
            grand_total += total

    resumo_data.append(["TOTAL", str(len(orcamentos)), _fmt_moeda(grand_total)])

    rw = [page_width * 0.4, page_width * 0.2, page_width * 0.4]
    resumo_table = Table(resumo_data, colWidths=rw)
    rn = len(resumo_data)
    resumo_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK_NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEABOVE", (0, -1), (-1, -1), 1, AMBER),
        *[("BACKGROUND", (0, i), (-1, i), LIGHT_BG) for i in range(2, rn - 1, 2)],
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER_COLOR),
        ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    elements.append(resumo_table)

    # === LISTAGEM ===
    if orcamentos:
        elements.append(Paragraph(f"DETALHAMENTO ({len(orcamentos)} orcamentos)", style_section))
        list_data = [["#", "Cliente", "Status", "Data", "Valor"]]
        for orc in orcamentos:
            list_data.append([
                f"#{orc['numero']:04d}",
                (orc.get("cliente_nome") or "-")[:30],
                _status_label(orc["status"]),
                _fmt_data(orc.get("criado_em")),
                _fmt_moeda(orc["valor_total"]),
            ])

        lcw = [page_width * 0.10, page_width * 0.30, page_width * 0.15, page_width * 0.18, page_width * 0.27]
        list_table = Table(list_data, colWidths=lcw, repeatRows=1)
        ln = len(list_data)
        list_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK_NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (2, 0), (3, -1), "CENTER"),
            ("ALIGN", (4, 0), (4, -1), "RIGHT"),
            *[("BACKGROUND", (0, i), (-1, i), LIGHT_BG) for i in range(2, ln, 2)],
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        ]))
        elements.append(list_table)

    # === RODAPÉ ===
    elements.append(Spacer(1, 6 * mm))
    foot_line = Table([[""]], colWidths=[page_width])
    foot_line.setStyle(TableStyle([("LINEBELOW", (0, 0), (0, 0), 0.5, BORDER_COLOR)]))
    elements.append(foot_line)
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph("Onseg Gestão", ParagraphStyle("F", parent=style_small, alignment=TA_CENTER)))

    doc.build(elements)
    result = buffer.getvalue()
    buffer.close()
    return result
