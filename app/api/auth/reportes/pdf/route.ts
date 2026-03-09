import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function POST(req: NextRequest) {
  try {
    const { dateRange, stats, clientes, ventas } = await req.json();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();

    // ── HEADER ──────────────────────────────────────────
    doc.setFillColor(0, 82, 204);
    doc.rect(0, 0, W, 28, 'F');

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURASYSTEM', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de Ventas e IGV', 14, 20);

    doc.setFontSize(9);
    doc.text(`Período: ${dateRange}`, W - 14, 20, { align: 'right' });

    // Fecha generación
    doc.setFontSize(7);
    doc.setTextColor(200, 220, 255);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, W - 14, 26, { align: 'right' });

    let y = 38;

    // ── KPI CARDS ────────────────────────────────────────
    const cardW = (W - 28 - 8) / 3;
    stats.forEach((s: { label: string; value: string; pct: string; isUp: boolean }, i: number) => {
      const x = 14 + i * (cardW + 4);
      doc.setFillColor(235, 242, 255);
      doc.roundedRect(x, y, cardW, 24, 3, 3, 'F');

      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text(s.label.toUpperCase(), x + 4, y + 7);

      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text(s.value, x + 4, y + 16);

      const trendColor = s.isUp ? [5, 150, 105] : [225, 29, 72];
      doc.setTextColor(trendColor[0], trendColor[1], trendColor[2]);
      doc.setFontSize(8);
      doc.text(`${s.isUp ? '▲' : '▼'} ${s.pct}`, x + 4, y + 22);
    });

    y += 34;

    // ── VENTAS MENSUALES ──────────────────────────────────
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Ventas Mensuales', 14, y);
    y += 4;

    const ventasRows = ventas.map((v: { month: string; ventas: number; igv: number }) => [
      v.month,
      `S/ ${v.ventas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      `S/ ${v.igv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      `S/ ${(v.ventas - v.igv).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
    ]);

    const totalVentas = ventas.reduce((s: number, v: { ventas: number }) => s + v.ventas, 0);
    const totalIgv = ventas.reduce((s: number, v: { igv: number }) => s + v.igv, 0);
    ventasRows.push([
      'TOTAL',
      `S/ ${totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      `S/ ${totalIgv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      `S/ ${(totalVentas - totalIgv).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['MES', 'VENTAS TOTALES', 'IGV GENERADO', 'SUBTOTAL']],
      body: ventasRows,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [0, 82, 204], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right', textColor: [255, 99, 33] },
        3: { halign: 'right', textColor: [100, 116, 139] },
      },
      didParseCell: (data) => {
        if (data.row.index === ventasRows.length - 1) {
          data.cell.styles.fillColor = [30, 41, 59];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.row.index % 2 === 0 && data.section === 'body') {
          data.cell.styles.fillColor = [248, 250, 252];
        }
      },
    });

    // ── CLIENTES ──────────────────────────────────────────
    const afterVentas = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen por Cliente', 14, afterVentas);

    const clienteRows = clientes.map((c: { name: string; docs: number; sub: string; igv: string; total: string }) => [
      c.name, c.docs, c.sub, c.igv, c.total,
    ]);

    autoTable(doc, {
      startY: afterVentas + 4,
      head: [['CLIENTE', 'N° DOCS', 'SUBTOTAL', 'IGV', 'TOTAL']],
      body: clienteRows,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [0, 82, 204], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right', textColor: [255, 99, 33] },
        4: { halign: 'right', fontStyle: 'bold', textColor: [0, 82, 204] },
      },
      didParseCell: (data) => {
        if (data.row.index % 2 === 0 && data.section === 'body') {
          data.cell.styles.fillColor = [248, 250, 252];
        }
      },
    });

    // ── FOOTER ────────────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageH - 12, W, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`FacturaSystem  •  Período: ${dateRange}  •  Documento confidencial`, W / 2, pageH - 5, { align: 'center' });

    const buffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_${dateRange.replace(/ /g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
  }
}