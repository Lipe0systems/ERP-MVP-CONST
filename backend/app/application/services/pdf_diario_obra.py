"""Gerador de PDF para relatório do Diário de Obra da Construtec."""
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

CLIMA_LABEL = {
    "ensolarado": "Ensolarado", "parcialmente_nublado": "Parcialmente nublado",
    "nublado": "Nublado", "chuvoso": "Chuvoso", "tempestade": "Tempestade",
}

def _fmt_data(d) -> str:
    if d is None: return "-"
    if hasattr(d, "date"): d = d.date()
    return d.strftime("%d/%m/%Y")


def gerar_pdf_diario(registros: list, obra_nome: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)
    styles = getSampleStyleSheet()
    elements = []

    style_n = ParagraphStyle("N", parent=styles["Normal"], fontName="Helvetica", fontSize=9, textColor=DARK_NAVY, leading=12)
    style_s = ParagraphStyle("S", parent=styles["Normal"], fontName="Helvetica", fontSize=7, textColor=GRAY_TEXT)
    style_h = ParagraphStyle("H", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11, textColor=DARK_NAVY, spaceBefore=5*mm, spaceAfter=3*mm)
    page_w = A4[0] - 30*mm

    logo = Image(LOGO_PATH, width=45*mm, height=13*mm) if os.path.exists(LOGO_PATH) else Paragraph("<b>Construtec</b>", styles["Title"])
    title = Paragraph(
        f"<b>DIARIO DE OBRA</b><br/><font size=8 color='#64748B'>{obra_nome}<br/>Gerado em {_fmt_data(date.today())}</font>",
        ParagraphStyle("T", parent=style_n, alignment=TA_RIGHT, fontSize=13))
    h = Table([[logo, title]], colWidths=[page_w*0.5, page_w*0.5])
    h.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BOTTOMPADDING",(0,0),(-1,-1),3*mm)]))
    elements.append(h)
    line = Table([[""]], colWidths=[page_w])
    line.setStyle(TableStyle([("LINEBELOW",(0,0),(0,0),2,AMBER)]))
    elements.append(line); elements.append(Spacer(1,5*mm))

    elements.append(Paragraph(f"REGISTROS — {len(registros)} entrada(s)", style_h))

    for reg in registros:
        # Cabeçalho do registro
        clima = CLIMA_LABEL.get(reg.clima or "", reg.clima or "-")
        header_data = [
            [f"Data: {_fmt_data(reg.data)}", f"Clima: {clima}", f"Fotos: {len(reg.fotos or [])}"]
        ]
        ht = Table(header_data, colWidths=[page_w*0.35, page_w*0.35, page_w*0.30])
        ht.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1),DARK_NAVY),("TEXTCOLOR",(0,0),(-1,-1),colors.white),
            ("FONTNAME",(0,0),(-1,-1),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),9),
            ("LEFTPADDING",(0,0),(-1,-1),3*mm),("TOPPADDING",(0,0),(-1,-1),2*mm),("BOTTOMPADDING",(0,0),(-1,-1),2*mm),
        ]))
        elements.append(ht)

        # Observações
        if reg.observacoes:
            obs_data = [[reg.observacoes]]
            ot = Table(obs_data, colWidths=[page_w])
            ot.setStyle(TableStyle([
                ("FONTNAME",(0,0),(-1,-1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),9),
                ("BACKGROUND",(0,0),(-1,-1),LIGHT_BG),("BOX",(0,0),(-1,-1),0.5,BORDER_COLOR),
                ("LEFTPADDING",(0,0),(-1,-1),3*mm),("RIGHTPADDING",(0,0),(-1,-1),3*mm),
                ("TOPPADDING",(0,0),(-1,-1),2*mm),("BOTTOMPADDING",(0,0),(-1,-1),2*mm),
                ("TEXTCOLOR",(0,0),(-1,-1),DARK_NAVY),
            ]))
            elements.append(ot)
        elements.append(Spacer(1,4*mm))

    elements.append(Spacer(1,3*mm))
    fl = Table([[""]], colWidths=[page_w])
    fl.setStyle(TableStyle([("LINEBELOW",(0,0),(0,0),0.5,BORDER_COLOR)]))
    elements.append(fl); elements.append(Spacer(1,2*mm))
    elements.append(Paragraph("Construtec - ERP para Construtoras",
        ParagraphStyle("F", parent=style_s, alignment=TA_CENTER)))

    doc.build(elements)
    result = buffer.getvalue(); buffer.close()
    return result
