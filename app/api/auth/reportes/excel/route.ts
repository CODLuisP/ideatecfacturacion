import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(req: NextRequest) {
  try {
    const { dateRange, clientes, ventas } = await req.json();

    const wb = new ExcelJS.Workbook();
    wb.creator = 'FacturaSystem';
    wb.created = new Date();

    const BLUE = '0052CC';
    const ORANGE = 'FF6321';
    const DARK = '1E293B';
    const LIGHT_BLUE = 'EBF2FF';
    const LIGHT_GRAY = 'F8FAFC';
    const GRAY = '64748B';
    const WHITE = 'FFFFFF';
    const BORDER_COLOR = 'E2E8F0';

    const thinBorder = (color = BORDER_COLOR): Partial<ExcelJS.Border> => ({
      style: 'thin', color: { argb: `FF${color}` },
    });
    const fullBorder = (color = BORDER_COLOR): Partial<ExcelJS.Borders> => ({
      top: thinBorder(color), bottom: thinBorder(color),
      left: thinBorder(color), right: thinBorder(color),
    });

    // ══════════════════════════════════════════════
    // HOJA 1: RESUMEN POR CLIENTE
    // ══════════════════════════════════════════════
    const ws1 = wb.addWorksheet('Resumen por Cliente');
    ws1.views = [{ showGridLines: false }];
    ws1.columns = [
      { key: 'name', width: 38 },
      { key: 'docs', width: 16 },
      { key: 'sub', width: 20 },
      { key: 'igv', width: 20 },
      { key: 'total', width: 20 },
    ];

    // Título
    ws1.mergeCells('A1:E1');
    const t1 = ws1.getCell('A1');
    t1.value = 'FACTURASYSTEM — Resumen por Cliente';
    t1.font = { name: 'Arial', bold: true, size: 16, color: { argb: `FF${BLUE}` } };
    t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_BLUE}` } };
    t1.alignment = { vertical: 'middle', indent: 1 };
    ws1.getRow(1).height = 38;

    ws1.mergeCells('A2:E2');
    const t2 = ws1.getCell('A2');
    t2.value = `Período: ${dateRange}`;
    t2.font = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } };
    t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_BLUE}` } };
    t2.alignment = { vertical: 'middle', indent: 1 };
    ws1.getRow(2).height = 22;
    ws1.getRow(3).height = 8;

    // Headers
    const headers1 = ['CLIENTE', 'N° DOCUMENTOS', 'SUBTOTAL (S/)', 'IGV (S/)', 'TOTAL (S/)'];
    const hRow1 = ws1.getRow(4);
    hRow1.height = 28;
    headers1.forEach((h, i) => {
      const cell = hRow1.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', bold: true, size: 9, color: { argb: `FF${WHITE}` } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BLUE}` } };
      cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle', indent: i === 0 ? 1 : 0 };
      cell.border = fullBorder(BLUE);
    });

    // Datos
    clientes.forEach((c: { name: string; docs: number; subNum: number; igvNum: number; totalNum: number }, i: number) => {
      const row = ws1.getRow(5 + i);
      row.height = 22;
      const bg = i % 2 === 0 ? LIGHT_GRAY : WHITE;

      const vals = [c.name, c.docs, c.subNum, c.igvNum, c.totalNum];
      vals.forEach((v, col) => {
        const cell = row.getCell(col + 1);
        cell.value = v;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
        cell.border = fullBorder();
        if (col === 0) {
          cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: `FF${DARK}` } };
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        } else if (col === 1) {
          cell.font = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (col === 2) {
          cell.font = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } };
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"S/ "#,##0.00';
        } else if (col === 3) {
          cell.font = { name: 'Arial', size: 10, color: { argb: `FF${ORANGE}` } };
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"S/ "#,##0.00';
        } else {
          cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: `FF${BLUE}` } };
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"S/ "#,##0.00';
        }
      });
    });

    // Fila total
    const totalRow1 = ws1.getRow(5 + clientes.length);
    totalRow1.height = 26;
    const totalCols1 = ['TOTAL', `=SUM(B5:B${4 + clientes.length})`, `=SUM(C5:C${4 + clientes.length})`, `=SUM(D5:D${4 + clientes.length})`, `=SUM(E5:E${4 + clientes.length})`];
    totalCols1.forEach((v, col) => {
      const cell = totalRow1.getCell(col + 1);
      cell.value = col === 0 ? v : { formula: v as string };
      cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: `FF${WHITE}` } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK}` } };
      cell.border = fullBorder(DARK);
      cell.alignment = { horizontal: col === 0 ? 'left' : 'right', vertical: 'middle', indent: col === 0 ? 1 : 0 };
      if (col > 1) cell.numFmt = '"S/ "#,##0.00';
      if (col === 1) cell.numFmt = '#,##0';
    });

    // ══════════════════════════════════════════════
    // HOJA 2: VENTAS MENSUALES
    // ══════════════════════════════════════════════
    const ws2 = wb.addWorksheet('Ventas Mensuales');
    ws2.views = [{ showGridLines: false }];
    ws2.columns = [
      { key: 'month', width: 14 },
      { key: 'ventas', width: 22 },
      { key: 'igv', width: 22 },
      { key: 'subtotal', width: 22 },
    ];

    ws2.mergeCells('A1:D1');
    const tv1 = ws2.getCell('A1');
    tv1.value = 'FACTURASYSTEM — Ventas Mensuales';
    tv1.font = { name: 'Arial', bold: true, size: 16, color: { argb: `FF${BLUE}` } };
    tv1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_BLUE}` } };
    tv1.alignment = { vertical: 'middle', indent: 1 };
    ws2.getRow(1).height = 38;

    ws2.mergeCells('A2:D2');
    const tv2 = ws2.getCell('A2');
    tv2.value = `Período: ${dateRange}`;
    tv2.font = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } };
    tv2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_BLUE}` } };
    tv2.alignment = { vertical: 'middle', indent: 1 };
    ws2.getRow(2).height = 22;
    ws2.getRow(3).height = 8;

    const headers2 = ['MES', 'VENTAS TOTALES (S/)', 'IGV GENERADO (S/)', 'SUBTOTAL (S/)'];
    const hRow2 = ws2.getRow(4);
    hRow2.height = 28;
    headers2.forEach((h, i) => {
      const cell = hRow2.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', bold: true, size: 9, color: { argb: `FF${WHITE}` } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BLUE}` } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = fullBorder(BLUE);
    });

    ventas.forEach((v: { month: string; ventas: number; igv: number }, i: number) => {
      const row = ws2.getRow(5 + i);
      row.height = 22;
      const bg = i % 2 === 0 ? LIGHT_GRAY : WHITE;

      const subtotal = v.ventas - v.igv;
      [v.month, v.ventas, v.igv, subtotal].forEach((val, col) => {
        const cell = row.getCell(col + 1);
        cell.value = val;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
        cell.border = fullBorder();
        cell.alignment = { horizontal: col === 0 ? 'center' : 'right', vertical: 'middle' };
        if (col === 0) {
          cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: `FF${DARK}` } };
        } else if (col === 1) {
          cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: `FF${BLUE}` } };
          cell.numFmt = '"S/ "#,##0.00';
        } else if (col === 2) {
          cell.font = { name: 'Arial', size: 10, color: { argb: `FF${ORANGE}` } };
          cell.numFmt = '"S/ "#,##0.00';
        } else {
          cell.font = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } };
          cell.numFmt = '"S/ "#,##0.00';
        }
      });
    });

    const totalRow2 = ws2.getRow(5 + ventas.length);
    totalRow2.height = 26;
    ['TOTAL', `=SUM(B5:B${4 + ventas.length})`, `=SUM(C5:C${4 + ventas.length})`, `=SUM(D5:D${4 + ventas.length})`].forEach((v, col) => {
      const cell = totalRow2.getCell(col + 1);
      cell.value = col === 0 ? v : { formula: v as string };
      cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: `FF${WHITE}` } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK}` } };
      cell.border = fullBorder(DARK);
      cell.alignment = { horizontal: col === 0 ? 'center' : 'right', vertical: 'middle' };
      if (col > 0) cell.numFmt = '"S/ "#,##0.00';
    });

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_${dateRange.replace(/ /g, '_')}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generando Excel:', error);
    return NextResponse.json({ error: 'Error al generar el Excel' }, { status: 500 });
  }
}