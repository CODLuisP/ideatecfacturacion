// ── Listado de comprobantes a crédito ─────────────────────────────────────────
export interface CuentaPorCobrar {
  comprobanteId: number
  tipoComprobante: string
  serie: string
  correlativo: number
  numeroCompleto: string
  fechaEmision: string
  fechaVencimiento: string
  tipoMoneda: string
  estadoSunat: string
  establecimientoAnexo: string
  usuarioCreacion: number
  clienteNumDoc: string
  clienteRznSocial: string
  clienteCorreo: string
  clienteWhatsApp: string
  valorVenta: number
  totalIGV: number
  importeTotal: number
  montoCredito: number
  tipoPago: string
}

// ── Cuota ─────────────────────────────────────────────────────────────────────
export interface Cuota {
  cuotaId: number
  comprobanteId: number
  numeroCuota: string
  monto: number
  fechaVencimiento: string
  montoPagado: number | null
  fechaPago: string | null
  estado: string | null
  montoDescuento: number
  motivoDescuento: string | null
  montoFinal: number | null
  tasaDescuentoDiaria: number
  diasAnticipacion: number
  porcentajeDescuento: number
  medioPago: string | null
  entidadFinanciera: string | null
  numeroOperacion: string | null
  observaciones: string | null
  usuarioRegistroPago: number | null
}

// ── Comprobante con cuotas ────────────────────────────────────────────────────
export interface ComprobanteConCuotas {
  comprobanteId: number
  tipoComprobante: string
  serie: string
  correlativo: number
  numeroCompleto: string
  fechaEmision: string
  fechaVencimiento: string
  tipoMoneda: string
  estadoSunat: string
  establecimientoAnexo: string
  usuarioCreacion: number
  clienteNumDoc: string
  clienteRznSocial: string
  clienteCorreo: string
  clienteWhatsApp: string
  valorVenta: number
  totalIGV: number
  importeTotal: number
  montoCredito: number
  tipoPago: string
  cuotas: Cuota[]
}

// ── Payload pagar cuota ───────────────────────────────────────────────────────
export interface PagarCuotaPayload {
  cuotaId: number
  montoPagado: number
  fechaPago: string
  medioPago: string
  entidadFinanciera?: string | null
  numeroOperacion?: string | null
  observaciones?: string | null
  usuarioRegistroPago: number
  tasaDescuentoDiaria?: number
  diasAnticipacion?: number
  porcentajeDescuento?: number
  montoDescuento?: number
  motivoDescuento?: string | null
  montoFinal?: number
}

// ── Filtros listado ───────────────────────────────────────────────────────────
export interface FiltrosCuentasPorCobrar {
  empresaRuc: string
  establecimientoAnexo?: string | null
  fechaInicio?: string | null
  fechaFin?: string | null
  clienteNumDoc?: string | null
}