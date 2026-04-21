// ── Interfaces para la respuesta de GET /api/Comprobantes/{ruc}/{serie}/{correlativo} ──

export interface ComprobanteCliente {
  clienteId: number
  tipoDocumento: string
  numeroDocumento: string
  razonSocial: string
  ubigeo: string
  direccionLineal: string
  departamento: string
  provincia: string
  distrito: string
}

export interface ComprobanteCompany {
  empresaId: number
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  establecimientoAnexo: string
  ubigeo: string
  direccionLineal: string
  departamento: string
  provincia: string
  distrito: string
}

export interface ComprobanteDetalle {
  detalleId: number
  comprobanteId: number
  item: number
  productoId: number
  codigo: string
  descripcion: string
  cantidad: number
  unidadMedida: string
  precioUnitario: number
  tipoAfectacionIGV: string
  porcentajeIGV: number
  montoIGV: number
  baseIgv: number
  codigoTipoDescuento: string
  descuentoUnitario: number
  descuentoTotal: number
  valorVenta: number
  precioVenta: number
  totalVentaItem: number
  icbper: number
  factorIcbper: number
}

export interface ComprobantePago {
  comprobanteId: number
  medioPago: string
  monto: number
  fechaPago: string
  numeroOperacion: string | null
  entidadFinanciera: string | null
  observaciones: string
}

export interface ComprobanteCuota {
  comprobanteId: number
  numeroCuota: string
  monto: number
  fechaVencimiento: string
  montoPagado: number | null
  fechaPago: string | null
  estado: string | null
}

export interface ComprobanteLegend {
  code: string
  value: string
}

export interface ComprobanteDetraccion {
  comprobanteID: number
  codigoBienDetraccion: string
  codigoMedioPago: string
  cuentaBancoDetraccion: string
  porcentajeDetraccion: number
  montoDetraccion: number
  observacion: string
}

export interface ComprobanteObtenido {
  ublVersion: string
  tipoOperacion: string
  tipoComprobante: string       // "01" = Factura, "03" = Boleta
  serie: string
  correlativo: string
  numeroCompleto: string
  tipoCambio: number
  fechaEmision: string
  horaEmision: string
  fechaVencimiento: string
  tipoMoneda: string
  tipoPago: string
  cliente: ComprobanteCliente
  company: ComprobanteCompany
  codigoTipoDescGlobal: string
  descuentoGlobal: number
  totalOperacionesGravadas: number
  totalOperacionesExoneradas: number
  totalOperacionesInafectas: number
  totalOperacionesGratuitas: number
  totalIgvGratuitas: number
  totalIGV: number
  totalImpuestos: number
  totalDescuentos: number
  totalOtrosCargos: number
  totalIcbper: number
  valorVenta: number
  subTotal: number
  importeTotal: number
  montoCredito: number
  details: ComprobanteDetalle[]
  pagos: ComprobantePago[]
  cuotas: ComprobanteCuota[]
  legends: ComprobanteLegend[]
  guias: any[]
  detracciones: ComprobanteDetraccion[]
  estadoSunat: string
  codigoHashCPE: string | null
  codigoRespuestaSunat: string
  mensajeRespuestaSunat: string
  fechaEnvioSunat: string
  usuarioCreacion: string | null
  fechaCreacion: string
  usuarioModificacion: string | null
  fechaModificacion: string
}