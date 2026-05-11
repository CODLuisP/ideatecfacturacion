import { ComprobanteListado } from "../Comprobante";
import { Sucursal } from "../../../operaciones/boleta/gestionBoletas/Boleta";

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface AgregarResumenDetalleDTO {
  lineID: number;
  comprobanteId: number;
  tipoComprobante: string;
  serie: string;
  correlativo: string;
  clienteTipoDoc: string | null;
  clienteNumDoc: string | null;
  clienteNombre: string | null;
  documentoAfectadoTipo: string | null;
  documentoAfectadoNumero: string | null;
  codigoCondicion: "1" | "3";
  moneda: string;
  montoTotalVenta: number;
  totalGravado: number;
  totalExonerado: number;
  totalInafecto: number;
  totalGratuito: number;
  totalIGV: number;
  igvReferencial: number;
}

export interface AgregarResumenComprobanteDTO {
  empresaId: number;
  empresaRuc: string | null;
  empresaRazonSocial: string | null;
  empresaDireccion: string | null;
  empresaProvincia: string | null;
  empresaDepartamento: string | null;
  empresaDistrito: string | null;
  empresaUbigeo: string | null;
  establecimientoAnexo: string | null;
  numeroEnvio: number;
  fechaEmisionDocumentos: string;
  fechaGeneracion: string;
  identificador: string;
  estadoSunat: string;
  ticket: string;
  codigoRespuesta: string;
  mensajeRespuesta: string;
  xmlGenerado: string;
  pdfGenerado: string | null;
  usuarioCreacion: number | null;
  fechaEnvio: string | null;
  detallesResumen: AgregarResumenDetalleDTO[];
}

export interface ComprobanteResumenResponse {
  exitoso: boolean;
  mensaje: string | null;
  comprobanteId: number | null;
  xmlBase64: string | null;
  xmlString: string | null;
  rutaZip: string | null;
  estadoSunat: string | null;
  codigoRespuesta: string | null;
  mensajeRespuesta: string | null;
  cdrBase64: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const generarIdentificador = (fecha: string, numeroEnvio = 1) => {
  const d = fecha.replace(/-/g, "");
  return `RC-${d}-${numeroEnvio}`;
};

export const formatFechaISO = (fecha: Date) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const buildResumenDTO = (
  comprobantes: ComprobanteListado[],
  codigoCondicionMap: Record<number, "1" | "3">,
  fechaEmision: string,
  usuarioId: number | null,
  sucursal: Sucursal,
  numeroEnvio: number = 1
): AgregarResumenComprobanteDTO => {
  const hoy = formatFechaISO(new Date());
  const primero = comprobantes[0];
  const identificador = generarIdentificador(fechaEmision, numeroEnvio);

  const detalles: AgregarResumenDetalleDTO[] = comprobantes.map((c, idx) => ({
    lineID: idx + 1,
    comprobanteId: c.comprobanteId,
    tipoComprobante: c.tipoComprobante,
    serie: c.serie,
    correlativo: c.correlativo,
    clienteTipoDoc: c.cliente?.tipoDocumento ?? null,
    clienteNumDoc: c.cliente?.numeroDocumento ?? null,
    clienteNombre: c.cliente?.razonSocial ?? null,
    documentoAfectadoTipo: c.tipDocAfectado ?? null,
    documentoAfectadoNumero: c.numDocAfectado ?? null,
    codigoCondicion: codigoCondicionMap[c.comprobanteId] ?? "1",
    moneda: c.tipoMoneda ?? "PEN",
    montoTotalVenta:      (codigoCondicionMap[c.comprobanteId] ?? "1") === "3" ? 0 : c.importeTotal,
    totalGravado:         (codigoCondicionMap[c.comprobanteId] ?? "1") === "3" ? 0 : c.totalOperacionesGravadas,
    totalExonerado:       (codigoCondicionMap[c.comprobanteId] ?? "1") === "3" ? 0 : c.totalOperacionesExoneradas,
    totalInafecto:        (codigoCondicionMap[c.comprobanteId] ?? "1") === "3" ? 0 : c.totalOperacionesInafectas,
    totalGratuito:        (codigoCondicionMap[c.comprobanteId] ?? "1") === "3" ? 0 : c.totalOperacionesGratuitas,
    totalIGV:             (codigoCondicionMap[c.comprobanteId] ?? "1") === "3" ? 0 : c.totalIGV,
    igvReferencial:       (codigoCondicionMap[c.comprobanteId] ?? "1") === "3" ? 0 : c.totalIgvGratuitas,
  }));

  return {
    empresaId: primero.company.empresaId,
    empresaRuc: sucursal.empresaRuc,
    empresaRazonSocial: primero.company.razonSocial,
    empresaDireccion: sucursal.direccion,
    empresaProvincia: primero.company.provincia,
    empresaDepartamento: primero.company.departamento,
    empresaDistrito: primero.company.distrito,
    empresaUbigeo: primero.company.ubigeo,
    establecimientoAnexo: sucursal.codEstablecimiento,
    numeroEnvio,
    fechaEmisionDocumentos: fechaEmision,
    fechaGeneracion: hoy,
    identificador,
    estadoSunat: "PENDIENTE",
    ticket: "",
    codigoRespuesta: "",
    mensajeRespuesta: "",
    xmlGenerado: "",
    pdfGenerado: null,
    usuarioCreacion: usuarioId,
    fechaEnvio: null,
    detallesResumen: detalles,
  };
};