"""Gerador de PDF para relatório de compras da Construtec."""
import io, os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

AMBER = colors.HexColor("#D4940A")
DARK_NAVY = colors.HexColor("#0F172A")
GRAY_TEXT = colors.HexColor("#64748B")
LIGHT_BG = colors.HexColor("#F8FAFC")
BORDER_COLOR = colors.HexColor("#E2E8F0")

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")
LOGO_PATH = os.path.join(ASSETS_DIR, "logo-construtec.png")

STATUS_LABEL = {"pendente": "Pendente", "aprovada": "Aprovada",
                "recebida": "Recebida", "cancelada": "Cancelada"}

def _fmt(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",","X").replace(".",",").replace("X",".")

def _fmt_data(d) -> str:
    if d is None: return "-"
    if hasattr(d, "date"): d = d.date()
    return d.strftime("%d/%m/%Y")


def gerar_pdf_compras(compras: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)
    styles = getSampleStyleSheet()
    elements = []

    style_n = ParagraphStyle("N", parent=styles["Normal"], fontName="Helvetica", fontSize=8, textColor=DARK_NAVY)
    style_s = ParagraphStyle("S", parent=styles["Normal"], fontName="Helvetica", fontSize=7, textColor=GRAY_TEXT)
    style_h = ParagraphStyle("H", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11, textColor=DARK_NAVY, spaceBefore=5*mm, spaceAfter=3*mm)
    page_w = A4[0] - 30*mm

    logo = Image(LOGO_PATH, width=45*mm, height=13*mm) if os.path.exists(LOGO_PATH) else Paragraph("<b>Construtec</b>", styles["Title"])
    title = Paragraph(f"<b>RELATORIO DE COMPRAS</b><br/><font size=7 color='#64748B'>Gerado em {_fmt_data(date.today())}</font>",
        ParagraphStyle("T", parent=style_n, alignment=TA_RIGHT, fontSize=13))
    h = Table([[logo, title]], colWidths=[page_w*0.5, page_w*0.5])
    h.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BOTTOMPADDING",(0,0),(-1,-1),3*mm)]))
    elements.append(h)
    line = Table([[""]], colWidths=[page_w])
    line.setStyle(TableStyle([("LINEBELOW",(0,0),(0,0),2,AMBER)]))
    elements.append(line); elements.append(Spacer(1,4*mm))

    total_geral = sum(float(c.valor_total) for c in compras if hasattr(c, "valor_total"))

    elements.append(Paragraph("COMPRAS", style_h))
    data = [["Data", "Produto", "Fornecedor", "Qtd", "Vlr Unit.", "Total", "Status"]]
    for c in compras:
        data.append([
            _fmt_data(c.data_compra),
            (c.produto or "")[:35],
            (c.fornecedor or "-")[:20],
            f"{float(c.quantidade):g} {c.unidade or ''}".strip(),
            _fmt(float(c.valor_unitario)),
            _fmt(float(c.valor_total)),
            STATUS_LABEL.get(c.status, c.status),
        ])
    data.append(["", "", "", "", "TOTAL:", _fmt(total_geral), ""])

    cw = [page_w*0.10, page_w*0.25, page_w*0.18, page_w*0.10, page_w*0.13, page_w*0.14, page_w*0.10]
    t = Table(data, colWidths=cw, repeatRows=1)
    n = len(data)
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),DARK_NAVY),("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),
        ("ALIGN",(3,0),(5,-1),"RIGHT"),("ALIGN",(6,0),(6,-1),"CENTER"),
        *[("BACKGROUND",(0,i),(-1,i),LIGHT_BG) for i in range(2,n-1,2)],
        ("BOX",(0,0),(-1,-2),0.5,BORDER_COLOR),("INNERGRID",(0,0),(-1,-2),0.25,BORDER_COLOR),
        ("FONTNAME",(0,-1),(-1,-1),"Helvetica-Bold"),("FONTSIZE",(4,-1),(5,-1),10),
        ("LINEABOVE",(4,-1),(5,-1),1.5,AMBER),
        ("TOPPADDING",(0,0),(-1,-1),1.5*mm),("BOTTOMPADDING",(0,0),(-1,-1),1.5*mm),
        ("LEFTPADDING",(0,0),(-1,-1),2*mm),("RIGHTPADDING",(0,0),(-1,-1),2*mm),
    ]))
    elements.append(t)

    elements.append(Spacer(1,5*mm))
    fl = Table([[""]], colWidths=[page_w])
    fl.setStyle(TableStyle([("LINEBELOW",(0,0),(0,0),0.5,BORDER_COLOR)]))
    elements.append(fl); elements.append(Spacer(1,2*mm))
    elements.append(Paragraph("Construtec - ERP para Construtoras",
        ParagraphStyle("F", parent=style_s, alignment=TA_CENTER)))

    doc.build(elements)
    result = buffer.getvalue(); buffer.close()
    return result
