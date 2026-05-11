import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import path from "path";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(os.homedir(), "Desktop", "productos_prueba_factunet.xlsx");

const workbook = new ExcelJS.Workbook();
workbook.creator = "Factunet";
workbook.created = new Date();

const sheet = workbook.addWorksheet("Productos", {
  pageSetup: { fitToPage: true, fitToWidth: 1 },
});

sheet.columns = [
  { key: "nomProducto",       width: 32 },
  { key: "precioUnitario",    width: 16 },
  { key: "tipoProducto",      width: 14 },
  { key: "tipoAfectacionIGV", width: 20 },
  { key: "incluirIGV",        width: 16 },
  { key: "unidadMedida",      width: 16 },
  { key: "stock",             width: 12 },
  { key: "codigoSunat",       width: 18 },
  { key: "codigo",            width: 18 },
];

// ── Fila 1: instrucción ───────────────────────────────────────────
const instrRow = sheet.getRow(1);
instrRow.getCell(1).value =
  "📋  Completa solo las columnas que necesites. Las marcadas como OPCIONAL pueden dejarse en blanco.";
instrRow.getCell(1).font = { italic: true, color: { argb: "FF555555" }, size: 10 };
sheet.mergeCells("A1:I1");
instrRow.height = 18;

// ── Fila 2: cabeceras ─────────────────────────────────────────────
const headers = [
  { label: "Nombre Producto",     optional: false },
  { label: "Precio Unitario",     optional: false },
  { label: "Tipo Producto",       optional: true  },
  { label: "Tipo Afectación IGV", optional: true  },
  { label: "Precio Incluye IGV",  optional: true  },
  { label: "Unidad de Medida",    optional: true  },
  { label: "Stock Inicial",       optional: true  },
  { label: "Código SUNAT",        optional: true  },
  { label: "Código Interno",      optional: true  },
];

const headerRow = sheet.getRow(2);
headerRow.height = 32;
headers.forEach((h, idx) => {
  const cell = headerRow.getCell(idx + 1);
  cell.value = h.optional ? `${h.label}\n(OPCIONAL)` : `${h.label}\n(OBLIGATORIO)`;
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cell.font  = { bold: true, size: 10, color: { argb: h.optional ? "FF333333" : "FFFFFFFF" } };
  cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: h.optional ? "FFDDEBF7" : "FF1F5EBF" } };
  cell.border = {
    top:    { style: "thin", color: { argb: "FFAAAAAA" } },
    left:   { style: "thin", color: { argb: "FFAAAAAA" } },
    bottom: { style: "thin", color: { argb: "FFAAAAAA" } },
    right:  { style: "thin", color: { argb: "FFAAAAAA" } },
  };
});

// ── 20 productos de prueba ────────────────────────────────────────
// Columnas: nomProducto | precioUnitario | tipoProducto | tipoAfectacionIGV | incluirIGV | unidadMedida | stock | codigoSunat | codigo
const productos = [
  // BIENES gravados (IGV 10) - precio incluye IGV
  ["Arroz Extra Superior 5kg",          12.50,  "BIEN",     "10", "TRUE",  "KGM", 200, "10061090", "ARR-001"],
  ["Aceite Vegetal Botella 1L",         8.90,   "BIEN",     "10", "TRUE",  "NIU", 150, "15121100", "ACE-001"],
  ["Azúcar Rubia 1kg",                  3.50,   "BIEN",     "10", "TRUE",  "KGM", 300, "17011400", "AZU-001"],
  ["Fideos Spaghetti 500g",             2.80,   "BIEN",     "10", "TRUE",  "KGM", 180, "19021900", "FID-001"],
  ["Leche Evaporada Lata 400g",         4.20,   "BIEN",     "10", "TRUE",  "NIU", 120, "04021000", "LEC-001"],
  ["Detergente en Polvo 1kg",           9.80,   "BIEN",     "10", "TRUE",  "KGM", 90,  "34021900", "DET-001"],
  ["Papel Higiénico x12 unidades",      14.50,  "BIEN",     "10", "TRUE",  "NIU", 75,  "48181000", "PAP-001"],
  ["Jabón de Tocador x3 und",           6.30,   "BIEN",     "10", "TRUE",  "NIU", 110, "34011100", "JAB-001"],
  ["Shampoo Frasco 400ml",              18.90,  "BIEN",     "10", "TRUE",  "NIU", 60,  "33051000", "SHA-001"],
  ["Gaseosa 1.5L",                      5.50,   "BIEN",     "10", "TRUE",  "LTR", 200, "22021000", "GAS-001"],
  // BIENES exonerados (IGV 20)
  ["Pollo Entero x kg",                 9.00,   "BIEN",     "20", "TRUE",  "KGM", 50,  "02071200", "POL-001"],
  ["Papa Blanca x kg",                  2.50,   "BIEN",     "20", "TRUE",  "KGM", 300, "07011000", "PAP-002"],
  ["Tomate x kg",                       3.20,   "BIEN",     "20", "TRUE",  "KGM", 150, "07020000", "TOM-001"],
  ["Limón x kg",                        4.50,   "BIEN",     "20", "TRUE",  "KGM", 100, "08055000", "LIM-001"],
  // BIENES sin precio con IGV (precio base sin IGV)
  ["Monitor LED 24 pulgadas",           450.00, "BIEN",     "10", "FALSE", "NIU", 10,  "84715200", "MON-001"],
  ["Teclado USB Inalámbrico",           85.00,  "BIEN",     "10", "FALSE", "NIU", 25,  "84716000", "TEC-001"],
  // SERVICIOS gravados
  ["Servicio de Delivery",              8.00,   "SERVICIO", "10", "TRUE",  "NIU", "",  "",          "SRV-DEL"],
  ["Servicio de Instalación",           120.00, "SERVICIO", "10", "TRUE",  "NIU", "",  "",          "SRV-INS"],
  // SERVICIOS inafectos
  ["Servicio de Consultoría Médica",    200.00, "SERVICIO", "30", "TRUE",  "NIU", "",  "",          "SRV-MED"],
  ["Servicio Educativo Mensual",        350.00, "SERVICIO", "30", "TRUE",  "NIU", "",  "",          "SRV-EDU"],
];

productos.forEach((prod, i) => {
  const row = sheet.getRow(i + 3);
  row.height = 20;
  prod.forEach((val, ci) => {
    const cell = row.getCell(ci + 1);
    cell.value = val === "" ? null : val;
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.font  = { size: 10 };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFFFFFFF" : "FFF7FAFF" } };
    cell.border = {
      top:    { style: "hair", color: { argb: "FFDDDDDD" } },
      left:   { style: "hair", color: { argb: "FFDDDDDD" } },
      bottom: { style: "hair", color: { argb: "FFDDDDDD" } },
      right:  { style: "hair", color: { argb: "FFDDDDDD" } },
    };
  });
});

// ── Hoja de referencia ────────────────────────────────────────────
const refSheet = workbook.addWorksheet("📖 Referencia");
refSheet.columns = [
  { key: "campo",   width: 26 },
  { key: "valores", width: 44 },
  { key: "defecto", width: 20 },
];

const refHeader = refSheet.getRow(1);
["Campo", "Valores válidos", "Valor por defecto"].forEach((txt, i) => {
  const c = refHeader.getCell(i + 1);
  c.value = txt;
  c.font  = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F5EBF" } };
  c.alignment = { vertical: "middle", horizontal: "center" };
});
refHeader.height = 24;

const refs = [
  ["Tipo Producto",       "BIEN | SERVICIO",                               "BIEN"],
  ["Tipo Afectación IGV", "10 (Gravado) | 20 (Exonerado) | 30 (Inafecto)", "10"],
  ["Precio Incluye IGV",  "TRUE | FALSE  (solo si IGV=10)",                "TRUE"],
  ["Unidad de Medida",    "NIU (Unidad) | KGM (Kg) | LTR (Litro)",         "NIU"],
  ["Stock Inicial",       "Número entero ≥ 0. Vacío si es SERVICIO.",      "0"],
  ["Código SUNAT",        "Catálogo SUNAT. Puede ir vacío.",               "(vacío)"],
  ["Código Interno",      "Texto libre. Vacío = se genera automático.",    "(auto)"],
];

refs.forEach(([campo, valores, defecto], ri) => {
  const rRow = refSheet.getRow(ri + 2);
  rRow.height = 20;
  [campo, valores, defecto].forEach((v, ci) => {
    const c = rRow.getCell(ci + 1);
    c.value = v;
    c.font  = { size: 10 };
    c.alignment = { vertical: "middle", wrapText: true };
    c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: ri % 2 === 0 ? "FFFFFFFF" : "FFF3F7FF" } };
    c.border = {
      top:    { style: "hair", color: { argb: "FFCCCCCC" } },
      bottom: { style: "hair", color: { argb: "FFCCCCCC" } },
      left:   { style: "hair", color: { argb: "FFCCCCCC" } },
      right:  { style: "hair", color: { argb: "FFCCCCCC" } },
    };
  });
});

// ── Guardar ───────────────────────────────────────────────────────
await workbook.xlsx.writeFile(outputPath);
console.log(`✅ Excel generado en: ${outputPath}`);
