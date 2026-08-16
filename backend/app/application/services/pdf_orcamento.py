"""
Gerador de PDF para orçamentos da Inovak Serviços.
Usa reportlab para criar um documento profissional com:
- Logo e dados reais da empresa emissora no cabeçalho
- Dados do cliente
- Vínculo com a obra, quando o orçamento estiver ligado a uma
- Tabela de itens com subtotais
- Total geral
- Condições de pagamento
- Observações
- Numeração de página no rodapé
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
LOGO_PATH = os.path.join(ASSETS_DIR, "logo-inovak.png")


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


from reportlab.pdfgen.canvas import Canvas


class _CanvasNumerado(Canvas):
    """
    Para mostrar "Página X de Y" é preciso saber o total de páginas ANTES
    de desenhar o rodapé de cada uma — mas o reportlab só descobre o total
    depois que o documento inteiro já foi montado. A solução padrão (e a
    única confiável) é: em vez de desenhar cada página assim que ela fica
    pronta, guarda todas em memória (`showPage` normalmente já "fecha" a
    página) e só desenha o rodapé de todas no final, quando o total já é
    conhecido.
    """

    def __init__(self, *args, **kwargs):
        Canvas.__init__(self, *args, **kwargs)
        self._paginas_salvas = []

    def showPage(self):
        self._paginas_salvas.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._paginas_salvas)
        for estado in self._paginas_salvas:
            self.__dict__.update(estado)
            self._desenhar_rodape_pagina(total)
            Canvas.showPage(self)
        Canvas.save(self)

    def _desenhar_rodape_pagina(self, total_paginas: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(GRAY_TEXT)
        texto = f"Página {self._pageNumber} de {total_paginas}"
        self.drawRightString(A4[0] - 20 * mm, 12 * mm, texto)
        self.restoreState()


def gerar_pdf_orcamento(
    orcamento: Orcamento,
    cliente: Cliente,
    empresa=None,
    obra_nome: str | None = None,
) -> bytes:
    """
    empresa: objeto/linha com nome, cnpj, email, telefone da construtora
             emissora (opcional — sem ele, cai no texto genérico anterior).
    obra_nome: nome da obra vinculada, se o orçamento tiver obra_id.
    """
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
    elif empresa is not None:
        logo = Paragraph(f"<b>{empresa.nome}</b>", styles["Title"])
    else:
        logo = Paragraph("<b>Inovak</b>", styles["Title"])

    # Linha de identificação da empresa emissora (CNPJ, e-mail, telefone) —
    # some quando `empresa` não é informado, pra não quebrar chamadas antigas.
    if empresa is not None:
        partes_empresa = [f"CNPJ {_fmt_documento(empresa.cnpj)}"]
        if empresa.email:
            partes_empresa.append(empresa.email)
        if empresa.telefone:
            partes_empresa.append(empresa.telefone)
        empresa_linha = Paragraph(
            " · ".join(partes_empresa),
            ParagraphStyle("EmpresaLinha", parent=style_small, fontSize=8),
        )
    else:
        empresa_linha = None

    orc_info = Paragraph(
        f"<b>ORCAMENTO #{orcamento.numero:04d}</b><br/>"
        f"<font size=8 color='#64748B'>Data: {_fmt_data(orcamento.criado_em)}</font>",
        ParagraphStyle("OrcInfo", parent=style_normal, alignment=TA_RIGHT, fontSize=14),
    )

    header = Table([[logo, orc_info]], colWidths=[page_width * 0.5, page_width * 0.5])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
    ]))
    elements.append(header)
    if empresa_linha is not None:
        elements.append(empresa_linha)
    elements.append(Spacer(1, 2 * mm))

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

    # === OBRA VINCULADA ===
    # Só aparece quando o orçamento está de fato ligado a uma obra — deixa
    # claro pro cliente pra qual projeto específico esse orçamento vale,
    # importante quando ele tem mais de uma obra em andamento.
    if obra_nome:
        elements.append(Spacer(1, 2 * mm))
        elements.append(Paragraph(
            f"<b>Obra vinculada:</b> {obra_nome}",
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

    # === CONDIÇÕES DE PAGAMENTO ===
    if orcamento.condicoes_pagamento:
        elements.append(Spacer(1, 4 * mm))
        elements.append(Paragraph("CONDICOES DE PAGAMENTO", style_section))
        elements.append(Paragraph(orcamento.condicoes_pagamento, style_normal))

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
    texto_rodape = empresa.nome if empresa is not None else "Inovak Serviços"
    elements.append(Paragraph(
        texto_rodape,
        ParagraphStyle("Footer", parent=style_small, alignment=TA_CENTER, textColor=GRAY_TEXT),
    ))

    doc.build(elements, canvasmaker=_CanvasNumerado)
    result = buffer.getvalue()
    buffer.close()
    return result
