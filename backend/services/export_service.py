from io import BytesIO
from typing import BinaryIO

import pandas as pd
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from sqlalchemy.orm import Session

from backend.models import Contrato, Alerta, SolicitudAuditoria


def export_contracts_to_excel(db: Session, solo_anomalos: bool = False) -> BytesIO:
    """Exportar contratos a Excel"""
    query = db.query(Contrato)
    if solo_anomalos:
        query = query.filter(Contrato.es_anomalo == True)

    contratos = query.all()

    data = []
    for c in contratos:
        data.append({
            'ID': c.id,
            'Código Proceso': c.codigo_proceso,
            'Entidad': c.entidad,
            'Título': c.titulo,
            'Proveedor': c.proveedor or '-',
            'Valor': f"${c.valor:,.0f}" if c.valor else '-',
            'Modalidad': c.modalidad or '-',
            'Fecha Publicación': c.fecha_publicacion.date() if c.fecha_publicacion else '-',
            'Ofertas': c.num_ofertas or '-',
            'Proponentes': c.num_proponentes or '-',
            'Score Anomalía': f"{c.score_anomalia:.4f}" if c.score_anomalia else '-',
            'Es Anómalo': 'Sí' if c.es_anomalo else 'No',
        })

    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Contratos', index=False)

    output.seek(0)
    return output


def export_alerts_to_excel(db: Session) -> BytesIO:
    """Exportar alertas a Excel"""
    alertas = db.query(Alerta).all()

    data = []
    for a in alertas:
        contrato = db.query(Contrato).filter(Contrato.id == a.contrato_id).first()
        data.append({
            'ID Alerta': a.id,
            'Contrato ID': a.contrato_id,
            'Entidad': contrato.entidad if contrato else '-',
            'Título': contrato.titulo if contrato else '-',
            'Nivel': a.nivel.upper(),
            'Mensaje': a.mensaje,
            'Score': f"{a.score:.4f}" if a.score else '-',
            'Fecha': a.created_at.date(),
        })

    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Alertas', index=False)

    output.seek(0)
    return output


def export_audit_requests_to_pdf(db: Session) -> BytesIO:
    """Exportar solicitudes de auditoría a PDF"""
    solicitudes = db.query(SolicitudAuditoria).all()

    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter,
                           topMargin=0.5*inch, bottomMargin=0.5*inch,
                           leftMargin=0.5*inch, rightMargin=0.5*inch)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=30,
        alignment=1,  # Center
    )

    story = []
    story.append(Paragraph('Reporte de Solicitudes de Auditoría', title_style))
    story.append(Spacer(1, 0.2*inch))

    # Summary
    summary_style = ParagraphStyle(
        'Summary',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=20,
    )

    total = len(solicitudes)
    pendientes = len([s for s in solicitudes if s.estado == 'pendiente'])
    en_proceso = len([s for s in solicitudes if s.estado == 'en_proceso'])
    completadas = len([s for s in solicitudes if s.estado == 'completada'])

    story.append(Paragraph(
        f'<b>Resumen:</b> Total: {total} | Pendientes: {pendientes} | En Proceso: {en_proceso} | Completadas: {completadas}',
        summary_style
    ))
    story.append(Spacer(1, 0.3*inch))

    # Table
    table_data = [['ID', 'Contrato', 'Motivo', 'Prioridad', 'Estado', 'Fecha']]

    for s in solicitudes:
        contrato = db.query(Contrato).filter(Contrato.id == s.contrato_id).first()
        table_data.append([
            str(s.id),
            contrato.codigo_proceso if contrato else '-',
            s.motivo[:30] + '...' if len(s.motivo) > 30 else s.motivo,
            s.prioridad.upper(),
            s.estado.upper(),
            s.created_at.strftime('%Y-%m-%d'),
        ])

    table = Table(table_data, colWidths=[0.7*inch, 1.2*inch, 1.8*inch, 1*inch, 1*inch, 1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ]))

    story.append(table)
    doc.build(story)

    output.seek(0)
    return output
