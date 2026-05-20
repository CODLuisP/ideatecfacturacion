// ── Listado de comprobantes al contado con estado de pago ─────────────────────
export interface DeudaContado {
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
  tipoPago: string

  // Datos del pago y su estado
  pagoId: number
  montoTotal: number
  montoPagado: number
  estado: string  // PENDIENTE | PARCIAL | PAGADO
}

// ── Historial de pagos de una deuda contado ───────────────────────────────────
export interface PagoDeudaContado {
  deudaPagoID: number
  pagoID: number
  montoPagado: number
  fechaPago: string
  medioPago: string | null
  entidadFinanciera: string | null
  numeroOperacion: string | null
  observaciones: string | null
  usuarioRegistroPago: number | null
  fechaRegistro: string
}

// ── Payload registrar pago ────────────────────────────────────────────────────
export interface RegistrarPagoDeudaPayload {
  pagoId: number
  montoPagado: number
  fechaPago: string
  medioPago: string
  entidadFinanciera?: string | null
  numeroOperacion?: string | null
  observaciones?: string | null
  usuarioRegistroPago: number
}

// ── Filtros listado ───────────────────────────────────────────────────────────
export interface FiltrosDeudaContado {
  empresaRuc: string
  establecimientoAnexo?: string | null
  fechaInicio?: string | null
  fechaFin?: string | null
  clienteNumDoc?: string | null
}

export interface EditarPagoDeudaPayload {
  deudaPagoId: number
  pagoId: number
  montoPagado: number
  fechaPago: string       // ISO string
  medioPago: string
  entidadFinanciera: string | null
  numeroOperacion: string | null
  observaciones: string | null
  usuarioRegistroPago: number | null
}