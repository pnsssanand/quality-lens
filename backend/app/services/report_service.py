import io
import csv
import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.units import inch

class ReportGenerationService:
    """
    Generates downloadable executive quality analytics reports in PDF and CSV format.
    Renders actual KPIs, Pareto rankings, production line comparisons, and root cause actions.
    """

    @classmethod
    def generate_csv_report(cls, report_data: Dict[str, Any]) -> str:
        """
        Exports comprehensive quality analytics into CSV format.
        """
        output = io.StringIO()
        writer = csv.writer(output)

        # Header metadata
        writer.writerow(["QUALITYLENS ENGINEERING QUALITY REPORT"])
        writer.writerow(["Title", report_data.get("title", "Executive Quality Summary")])
        writer.writerow(["Generated At", datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow(["Reporting Period", report_data.get("period", "All recorded data")])
        writer.writerow([])

        # KPI Summary
        kpis = report_data.get("kpis", {})
        writer.writerow(["--- EXECUTIVE QUALITY KPIS ---"])
        writer.writerow(["Total Inspected Units", kpis.get("total_inspected_units", 0)])
        writer.writerow(["Total Defective Units", kpis.get("total_defective_units", 0)])
        writer.writerow(["Overall Defect Rate (%)", f"{kpis.get('overall_defect_rate', 0)}%"])
        writer.writerow(["First Pass Yield (%)", f"{kpis.get('first_pass_yield', 0)}%"])
        writer.writerow(["Total Inspections", kpis.get("total_inspections", 0)])
        writer.writerow(["Defect Categories Count", kpis.get("number_of_defect_categories", 0)])
        writer.writerow(["Open Investigations", kpis.get("open_investigations", 0)])
        writer.writerow(["Threshold Status", kpis.get("threshold_status", "NORMAL")])
        writer.writerow([])

        # Pareto Analysis
        writer.writerow(["--- PARETO DEFECT RANKING ---"])
        writer.writerow(["Rank", "Defect Category", "Defect Count", "Contribution (%)", "Cumulative (%)", "Vital Few (80%)"])
        for idx, item in enumerate(report_data.get("pareto", []), start=1):
            writer.writerow([
                idx,
                item.get("category"),
                item.get("defect_count"),
                f"{item.get('percentage')}%",
                f"{item.get('cumulative_percentage')}%",
                "YES" if item.get("is_vital_few") else "NO"
            ])
        writer.writerow([])

        # Production Line Comparison
        writer.writerow(["--- PRODUCTION LINE COMPARISON ---"])
        writer.writerow(["Production Line", "Inspected Units", "Defective Units", "Defect Rate (%)", "Status"])
        for line in report_data.get("lines", []):
            writer.writerow([
                line.get("production_line"),
                line.get("inspected_units"),
                line.get("defective_units"),
                f"{line.get('defect_rate')}%",
                line.get("status")
            ])
        writer.writerow([])

        # Investigations
        writer.writerow(["--- OPEN INVESTIGATIONS & CORRECTIVE ACTIONS ---"])
        writer.writerow(["Reference", "Defect Category", "Line", "Status", "Verified Root Cause", "Corrective Action"])
        for inv in report_data.get("investigations", []):
            writer.writerow([
                inv.get("investigation_reference"),
                inv.get("defect_category"),
                inv.get("production_line"),
                inv.get("investigation_status"),
                inv.get("verified_root_cause") or "Pending verification",
                inv.get("corrective_action") or "Action in progress"
            ])

        return output.getvalue()

    @classmethod
    def generate_pdf_report(cls, report_data: Dict[str, Any]) -> bytes:
        """
        Builds a styled PDF document using ReportLab.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0f243a')
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569')
        )
        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=colors.HexColor('#1e5284'),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1e293b')
        )

        elements = []

        # Header Title
        elements.append(Paragraph("QualityLens", title_style))
        elements.append(Paragraph("Engineering Quality Analytics & Root Cause Intelligence Platform", subtitle_style))
        gen_time = datetime.datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")
        elements.append(Paragraph(f"<b>Report:</b> {report_data.get('title', 'Executive Summary')} | <b>Generated:</b> {gen_time}", subtitle_style))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1e5284'), spaceBefore=2, spaceAfter=12))

        # 1. Executive Quality KPIs
        elements.append(Paragraph("1. Executive Quality Performance Indicators", section_style))
        kpis = report_data.get("kpis", {})
        
        kpi_table_data = [
            ["Metric", "Value", "Metric", "Value"],
            ["Total Inspected Units", f"{kpis.get('total_inspected_units', 0):,}", "First Pass Yield (FPY)", f"{kpis.get('first_pass_yield', 0)}%"],
            ["Total Defective Units", f"{kpis.get('total_defective_units', 0):,}", "Overall Defect Rate", f"{kpis.get('overall_defect_rate', 0)}%"],
            ["Total Inspections", f"{kpis.get('total_inspections', 0):,}", "Defect Categories", f"{kpis.get('number_of_defect_categories', 0)}"],
            ["Open Investigations", f"{kpis.get('open_investigations', 0)}", "System Quality Status", f"{kpis.get('threshold_status', 'NORMAL')}"]
        ]
        
        kpi_table = Table(kpi_table_data, colWidths=[130, 130, 130, 130])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f243a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 10))

        # 2. Pareto Defect Analysis
        elements.append(Paragraph("2. Pareto Failure Mode Ranking (80/20 Analysis)", section_style))
        pareto_rows = [["Rank", "Defect Category", "Defect Count", "Contribution", "Cumulative %", "Vital Few"]]
        for idx, item in enumerate(report_data.get("pareto", [])[:7], start=1):
            pareto_rows.append([
                str(idx),
                str(item.get("category", "")),
                f"{item.get('defect_count', 0):,}",
                f"{item.get('percentage', 0)}%",
                f"{item.get('cumulative_percentage', 0)}%",
                "YES (Target)" if item.get("is_vital_few") else "No"
            ])
        if len(pareto_rows) == 1:
            pareto_rows.append(["-", "No defects recorded in selected scope", "0", "0%", "0%", "-"])

        pareto_table = Table(pareto_rows, colWidths=[40, 180, 80, 75, 75, 70])
        pareto_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e5284')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
        ]))
        elements.append(pareto_table)
        elements.append(Spacer(1, 10))

        # 3. Production Line Performance
        elements.append(Paragraph("3. Production Line Comparison & Quality Status", section_style))
        line_rows = [["Production Line", "Inspected Units", "Defective Units", "Defect Rate (%)", "Status"]]
        for line in report_data.get("lines", []):
            line_rows.append([
                str(line.get("production_line", "")),
                f"{line.get('inspected_units', 0):,}",
                f"{line.get('defective_units', 0):,}",
                f"{line.get('defect_rate', 0)}%",
                str(line.get("status", "NORMAL"))
            ])
        if len(line_rows) == 1:
            line_rows.append(["-", "0", "0", "0%", "NORMAL"])

        line_table = Table(line_rows, colWidths=[140, 100, 100, 90, 90])
        line_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e5284')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ]))
        elements.append(line_table)
        elements.append(Spacer(1, 10))

        # 4. Engineering Recommendations & Limitations
        elements.append(Paragraph("4. Root Cause Recommendations & Data Assumptions", section_style))
        elements.append(Paragraph(
            "<b>Engineering Action Items:</b> Focus continuous improvement kaizen events on the top vital-few defect categories identified above. "
            "Ensure calibration schedules on machines displaying warning/critical status. Complete verified 5 Whys root cause verification before closing investigations.",
            body_style
        ))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(
            "<b>Methodology & Limitations:</b> All KPIs and failure distributions are calculated dynamically from imported inspection records. "
            "First Pass Yield reflects units passing initial inspection without defect. Demonstration datasets are synthetic engineering models.",
            subtitle_style
        ))

        doc.build(elements)
        return buffer.getvalue()
