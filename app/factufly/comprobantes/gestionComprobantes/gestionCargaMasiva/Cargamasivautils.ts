import * as XLSX from "xlsx";
import { FilaExcel, ComprobanteAgrupado, ItemAgrupado } from "./Cargamasivatypes";

// ─── Validar correos separados por coma ───────────────────────────────────────
export function validarCorreos(correo: string | null): string | null {
  if (!correo || correo.trim() === "") return null;
  const lista = correo.split(",").map((c) => c.trim()).filter(Boolean);
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidos = lista.filter((c) => !regexCorreo.test(c));
  if (invalidos.length > 0)
    return `Correo(s) inválido(s): ${invalidos.join(", ")}`;
  return null;
}

// ─── Validar teléfonos WhatsApp separados por coma ───────────────────────────
export function validarWhatsapp(whatsapp: string | null): string | null {
  if (!whatsapp || whatsapp.trim() === "") return null;
  const lista = whatsapp.split(",").map((w) => w.trim()).filter(Boolean);
  const invalidos = lista.filter((w) => !/^9\d{8}$/.test(w));
  if (invalidos.length > 0)
    return `Número(s) WhatsApp inválido(s): ${invalidos.join(", ")} (deben tener 9 dígitos y empezar con 9)`;
  return null;
}

// ─── Validar fecha de emisión (máx 2 días antes de hoy) ──────────────────────
export function validarFechaEmision(fecha: string): string | null {
  if (!fecha) return "La fecha de emisión es requerida";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0);
  const diffMs = hoy.getTime() - f.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  if (diffDias > 2) return "La fecha de emisión no puede ser mayor a 2 días antes de hoy";
  if (diffDias < 0) return "La fecha de emisión no puede ser futura";
  return null;
}

// ─── Determinar tipo de documento ─────────────────────────────────────────────
export function determinarTipoDoc(rucDni: string): {
  tipoDoc: "01" | "06";
  tipoComprobante: "03" | "01";
  error: string | null;
} {
  const limpio = String(rucDni).trim();
  if (limpio.length === 8) return { tipoDoc: "01", tipoComprobante: "03", error: null };
  if (limpio.length === 11) return { tipoDoc: "06", tipoComprobante: "01", error: null };
  return {
    tipoDoc: "01",
    tipoComprobante: "03",
    error: `RUC/DNI "${limpio}" inválido: debe tener 8 dígitos (DNI) o 11 dígitos (RUC)`,
  };
}

// ─── Leer y parsear el Excel ──────────────────────────────────────────────────
export async function parsearExcel(file: File): Promise<{
  filas: FilaExcel[];
  fechaEmision: string;
  erroresGlobales: string[];
}> {
  const erroresGlobales: string[] = [];
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];

  // Fila 2 (índice 1): FECHA EMISION columna J (índice 9)
  let fechaEmision = "";
  const filaFecha = raw[1] ?? [];
  const celdaFecha = filaFecha[9];
  if (celdaFecha) {
    if (typeof celdaFecha === "number") {
      const dateObj = XLSX.SSF.parse_date_code(celdaFecha);
      fechaEmision = `${dateObj.y}-${String(dateObj.m).padStart(2, "0")}-${String(dateObj.d).padStart(2, "0")}`;
    } else {
      const partes = String(celdaFecha).split("/");
      if (partes.length === 3) {
        fechaEmision = `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
      } else {
        fechaEmision = String(celdaFecha);
      }
    }
  }

  if (!fechaEmision) {
    erroresGlobales.push("No se encontró la fecha de emisión en la celda J2 del Excel");
  }

  // Fila 3 (índice 2): cabeceras — datos desde fila 4 (índice 3)
  const filas: FilaExcel[] = [];
  let ultimoRucDni = ""; // para rastrear el grupo actual

  for (let i = 3; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.every((c: any) => c === "" || c === null || c === undefined)) continue;

    const rucDni = String(row[0] ?? "").trim();
    const razonSocial = String(row[1] ?? "").trim();
    const detalle = String(row[2] ?? "").trim();
    const cantidad = Number(row[3]) || 0;
    const precioUnitario = Number(row[4]) || 0;
    const igv = Number(row[5]) || 18;
    const unidadMedida = String(row[6] ?? "ZZ").trim() || "ZZ";
    const moneda = String(row[7] ?? "PEN").trim() || "PEN";
    const correo = String(row[8] ?? "").trim() || null;
    const whatsapp = String(row[9] ?? "").trim() || null;

    // Si rucDni está vacío, es fila de detalle adicional del grupo anterior
    const esFilaDetalle = !rucDni && !!ultimoRucDni;

    const erroresFila: string[] = [];

    // Solo validar rucDni y razonSocial si NO es fila de detalle
    if (!esFilaDetalle) {
      if (!rucDni) {
        erroresFila.push(`Fila ${i + 1}: RUC/DNI vacío (primera fila de un comprobante debe tener RUC/DNI)`);
      } else {
        const { error } = determinarTipoDoc(rucDni);
        if (error) erroresFila.push(`Fila ${i + 1}: ${error}`);
        ultimoRucDni = rucDni; // actualizar grupo actual
      }
      if (!razonSocial) erroresFila.push(`Fila ${i + 1}: Razón social vacía`);
    }

    // Validaciones comunes para todas las filas
    if (!detalle) erroresFila.push(`Fila ${i + 1}: Detalle vacío`);
    if (cantidad <= 0) erroresFila.push(`Fila ${i + 1}: Cantidad debe ser mayor a 0`);
    if (precioUnitario <= 0) erroresFila.push(`Fila ${i + 1}: Precio unitario debe ser mayor a 0`);
    if (igv !== 18 && igv !== 10.5) erroresFila.push(`Fila ${i + 1}: IGV debe ser 18 o 10.5`);

    // Validar correo y whatsapp solo en fila cabecera
    if (!esFilaDetalle) {
      const errCorreo = validarCorreos(correo);
      if (errCorreo) erroresFila.push(`Fila ${i + 1}: ${errCorreo}`);

      const errWsp = validarWhatsapp(whatsapp);
      if (errWsp) erroresFila.push(`Fila ${i + 1}: ${errWsp}`);
    }

    erroresGlobales.push(...erroresFila);

    filas.push({
      rucDni: rucDni || "",
      razonSocial: razonSocial || "",
      detalle,
      cantidad,
      precioUnitario,
      igv,
      unidadMedida,
      moneda,
      correo,
      whatsapp,
    });
  }

  return { filas, fechaEmision, erroresGlobales };
}

// ─── Agrupar filas en comprobantes ───────────────────────────────────────────
export function agruparComprobantes(filas: FilaExcel[]): ComprobanteAgrupado[] {
  const grupos: ComprobanteAgrupado[] = [];
  let grupoActual: ComprobanteAgrupado | null = null;

  for (const fila of filas) {
    const rucDniActual = String(fila.rucDni ?? "").trim();

    const item: ItemAgrupado = {
      descripcion: fila.detalle,
      cantidad: fila.cantidad,
      precioUnitario: fila.precioUnitario,
      igvPct: fila.igv,
      unidadMedida: fila.unidadMedida || "ZZ",
    };

    // Fila de detalle sin rucDni → agrega al grupo anterior
    if (!rucDniActual && grupoActual) {
      grupoActual.items.push(item);
      continue;
    }

    // Mismo rucDni que el grupo actual → agrega ítem
    if (grupoActual && grupoActual.rucDni === rucDniActual) {
      grupoActual.items.push(item);
      continue;
    }

    // Nuevo grupo
    const { tipoDoc, tipoComprobante } = determinarTipoDoc(rucDniActual);

    grupoActual = {
      id: crypto.randomUUID(),
      rucDni: rucDniActual,
      razonSocial: fila.razonSocial,
      tipoDoc,
      tipoComprobante,
      moneda: fila.moneda || "PEN",
      correo: fila.correo || null,
      whatsapp: fila.whatsapp || null,
      items: [item],
      consultandoApi: false,
      apiEncontrado: null,
      apiError: null,
      tieneAdvertencia: false,
      ubigeo: "",
      direccionLineal: "",
      departamento: "",
      provincia: "",
      distrito: "",
      errores: [],
    };

    grupos.push(grupoActual);
  }

  return grupos;
}

// ─── Calcular totales de un comprobante ──────────────────────────────────────
export function calcularTotales(comp: ComprobanteAgrupado) {
  let gravadas = 0, igv = 0;

  for (const item of comp.items) {
    const totalItem = item.precioUnitario * item.cantidad;
    const montoIgv = parseFloat((totalItem - totalItem / (1 + item.igvPct / 100)).toFixed(2));
    const base = parseFloat((totalItem - montoIgv).toFixed(2));
    gravadas += base;
    igv += montoIgv;
  }

  gravadas = parseFloat(gravadas.toFixed(2));
  igv = parseFloat(igv.toFixed(2));
  const importeTotal = parseFloat((gravadas + igv).toFixed(2));

  return { gravadas, igv, importeTotal };
}

// ─── Generar plantilla Excel básica ──────────────────────────────────────────
export function generarPlantillaExcel(): void {
  const wb = XLSX.utils.book_new();

  const hoy = new Date();
  const fechaStr = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;

  const data: any[][] = [
    ["CARGA MASIVA DE DOCUMENTOS", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "FECHA EMISION:", fechaStr],
    ["RUC/DNI", "RAZON SOCIAL", "DETALLE", "CANTIDAD", "PRECIO_UNITARIO", "IGV", "UNIDAD_MEDIDA", "MONEDA", "CORREO", "WHATSAAP"],
    ["60288745", "HUGO CESAR GOMEZ LOVERA", "item 1 detalle Producto o servicio de ejemplo", 1, 59, 18, "ZZ", "PEN", "hugo@gmail.com", "989106686"],
    ["", "", "item 2 detalle Producto o servicio de ejemplo", 3, 145, 18, "ZZ", "PEN", "", ""],
    ["10602887451", "empresa peru sac", "item 1 detalle Producto o servicio de ejemplo", 1, 80, 18, "ZZ", "PEN", "empresa@gmail.com", ""],
    ["", "", "item 2 detalle Producto o servicio de ejemplo", 1, 40, 18, "ZZ", "PEN", "", ""],
    ["30201030", "nombre de ejemplo", "item 1 detalle Producto o servicio de ejemplo", 2, 118, 10.5, "ZZ", "PEN", "Correo1@mail.com, correo2@mail.com", "987654321"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = [
    { wch: 14 }, { wch: 35 }, { wch: 50 }, { wch: 10 },
    { wch: 16 }, { wch: 6 }, { wch: 14 }, { wch: 8 },
    { wch: 30 }, { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Carga Masiva");
  XLSX.writeFile(wb, "plantilla_carga_masiva.xlsx");
}