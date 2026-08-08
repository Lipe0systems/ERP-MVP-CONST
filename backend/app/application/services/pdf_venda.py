"""Gerador de PDF para venda da Construtec."""
import io, os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.domain.entities.cliente import Cliente
from app.domain.entities.venda import FORMA_PAGAMENTO_LABEL, Venda

AMBER = colors.HexColor("#D4940A")
DARK_NAVY = colors.HexColor("#0F172A")
GRAY_TEXT = colors.HexColor("#64748B")
LIGHT_BG = colors.HexColor("#F8FAFC")
BORDER_COLOR = colors.HexColor("#E2E8F0")
GREEN = colors.HexColor("#16A34A")

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")
LOGO_PATH = os.path.join(ASSETS_DIR, "logo-construtec.png")

def _fmt(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",","X").replace(".",",").replace("X",".")

def _fmt_data(d) -> str:
    if d is None: return "-"
    if hasattr(d, "date"): d = d.date()
    return d.strftime("%d/%m/%Y")


def gerar_pdf_venda(venda: Venda, cliente: Cliente) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)
    styles = getSampleStyleSheet()
    elements = []

    style_n = ParagraphStyle("N", parent=styles["Normal"], fontName="Helvetica", fontSize=9, textColor=DARK_NAVY, leading=12)
    style_s = ParagraphStyle("S", parent=styles["Normal"], fontName="Helvetica", fontSize=8, textColor=GRAY_TEXT)
    style_h = ParagraphStyle("H", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11, textColor=DARK_NAVY, spaceBefore=5*mm, spaceAfter=3*mm)
    page_w = A4[0] - 30*mm

    # Cabeçalho
    logo = Image(LOGO_PATH, width=45*mm, height=13*mm) if os.path.exists(LOGO_PATH) else Paragraph("<b>Construtec</b>", styles["Title"])
    title = Paragraph(f"<b>CONFIRMACAO DE VENDA #{venda.numero:04d}</b><br/><font size=8 color='#64748B'>Data: {_fmt_data(venda.criado_em)}</font>",
        ParagraphStyle("T", parent=style_n, alignment=TA_RIGHT, fontSize=13))
    h = Table([[logo, title]], colWidths=[page_w*0.5, page_w*0.5])
    h.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BOTTOMPADDING",(0,0),(-1,-1),3*mm)]))
    elements.append(h)
    line = Table([[""]], colWidths=[page_w])
    line.setStyle(TableStyle([("LINEBELOW",(0,0),(0,0),2,AMBER)]))
    elements.append(line); elements.append(Spacer(1,4*mm))

    # Cliente
    elements.append(Paragraph("CLIENTE", style_h))
    doc_str = cliente.documento
    if len(doc_str) == 11:
        doc_str = f"{doc_str[:3]}.{doc_str[3:6]}.{doc_str[6:9]}-{doc_str[9:]}"
    elif len(doc_str) == 14:
        doc_str = f"{doc_str[:2]}.{doc_str[2:5]}.{doc_str[5:8]}/{doc_str[8:12]}-{doc_str[12:]}"
    info = [["Nome:", cliente.nome, "CPF/CNPJ:", doc_str],
            ["E-mail:", cliente.email or "-", "Telefone:", cliente.telefone or "-"]]
    cw = page_w/4
    t = Table(info, colWidths=[cw*0.5, cw*1.5, cw*0.7, cw*1.3])
    t.setStyle(TableStyle([
        ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("FONTNAME",(2,0),(2,-1),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,-1),9),("BACKGROUND",(0,0),(-1,-1),LIGHT_BG),
        ("BOX",(0,0),(-1,-1),0.5,BORDER_COLOR),("INNERGRID",(0,0),(-1,-1),0.25,BORDER_COLOR),
        ("LEFTPADDING",(0,0),(-1,-1),3*mm),("RIGHTPADDING",(0,0),(-1,-1),3*mm),
        ("TOPPADDING",(0,0),(-1,-1),1.5*mm),("BOTTOMPADDING",(0,0),(-1,-1),1.5*mm),
    ]))
    elements.append(t)

    # Resumo financeiro
    elements.append(Paragraph("RESUMO", style_h))
    resumo = [
        ["Valor total:", _fmt(venda.valor_total)],
        ["Desconto:", _fmt(venda.desconto)],
        ["Valor líquido:", _fmt(venda.valor_liquido)],
        ["Forma de pagamento:", FORMA_PAGAMENTO_LABEL.get(venda.forma_pagamento, str(venda.forma_pagamento))],
        ["Parcelas:", str(len(venda.parcelas))],
    ]
    rt = Table(resumo, colWidths=[page_w*0.4, page_w*0.6])
    rt.setStyle(TableStyle([
        ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),9),
        ("FONTSIZE",(0,2),(1,2),11),("FONTNAME",(0,2),(1,2),"Helvetica-Bold"),
        ("TEXTCOLOR",(1,2),(1,2),GREEN),
        ("BACKGROUND",(0,0),(-1,-1),LIGHT_BG),("LEFTPADDING",(0,0),(-1,-1),3*mm),
        ("RIGHTPADDING",(0,0),(-1,-1),3*mm),("TOPPADDING",(0,0),(-1,-1),1.5*mm),
        ("BOTTOMPADDING",(0,0),(-1,-1),1.5*mm),
        ("BOX",(0,0),(-1,-1),0.5,BORDER_COLOR),("INNERGRID",(0,0),(-1,-1),0.25,BORDER_COLOR),
    ]))
    elements.append(rt)

    # Parcelas
    if venda.parcelas:
        elements.append(Paragraph("PARCELAS", style_h))
        pdata = [["Parcela", "Vencimento", "Valor"]]
        for p in venda.parcelas:
            pdata.append([f"{p.numero}/{len(venda.parcelas)}", _fmt_data(p.vencimento), _fmt(p.valor)])
        pt = Table(pdata, colWidths=[page_w*0.2, page_w*0.4, page_w*0.4], repeatRows=1)
        n = len(pdata)
        pt.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,0),DARK_NAVY),("TEXTCOLOR",(0,0),(-1,0),colors.white),
            ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),9),
            ("ALIGN",(1,0),(2,-1),"RIGHT"),
            *[("BACKGROUND",(0,i),(-1,i),LIGHT_BG) for i in range(2,n,2)],
            ("BOX",(0,0),(-1,-1),0.5,BORDER_COLOR),("INNERGRID",(0,0),(-1,-1),0.25,BORDER_COLOR),
            ("LEFTPADDING",(0,0),(-1,-1),3*mm),("RIGHTPADDING",(0,0),(-1,-1),3*mm),
            ("TOPPADDING",(0,0),(-1,-1),1.5*mm),("BOTTOMPADDING",(0,0),(-1,-1),1.5*mm),
        ]))
        elements.append(pt)

    # Observações
    if venda.observacoes:
        elements.append(Paragraph("OBSERVACOES", style_h))
        elements.append(Paragraph(venda.observacoes, style_n))

    # Rodapé
    elements.append(Spacer(1,6*mm))
    fl = Table([[""]], colWidths=[page_w])
    fl.setStyle(TableStyle([("LINEBELOW",(0,0),(0,0),0.5,BORDER_COLOR)]))
    elements.append(fl); elements.append(Spacer(1,2*mm))
    elements.append(Paragraph("Construtec - ERP para Construtoras",
        ParagraphStyle("F", parent=style_s, alignment=TA_CENTER)))

    doc.build(elements)
    result = buffer.getvalue(); buffer.close()
    return result
