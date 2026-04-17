// ── Interfaces para envío de Nota de Crédito al backend ─────────────────────

export interface NotaCreditoAddress {
  direccion: string
  provincia: string
  departamento: string
  distrito: string
  ubigueo: string
}

export interface NotaCreditoCompany {
  ruc: string
  codEstablecimiento: string
  razonSocial: string
  nombreComercial: string
  address: NotaCreditoAddress
}

export interface NotaCreditoClient {
  tipoDoc: string
  numDoc: string
  rznSocial: string
  address: NotaCreditoAddress | null
}

export interface NotaCreditoDetalle {
  productoId: number
  codProducto: string | null
  unidad: string
  descripcion: string
  cantidad: number
  mtoValorUnitario: number
  mtoValorVenta: number
  mtoBaseIgv: number
  porcentajeIgv: number
  igv: number
  tipAfeIgv: number
  mtoPrecioUnitario: number
  totalVentaItem: number
  icbper: number
  factorIcbper: number
}

export interface NotaCreditoLegend {
  code: string
  value: string
}

export interface NotaCredito {
  ublVersion: string
  tipoDoc: string               // "07" nota de crédito
  serie: string
  correlativo: string
  fechaEmision: string
  tipoMoneda: string
  tipoOperacion: string
  tipDocAfectado: string        // "01" factura / "03" boleta
  numDocAfectado: string        // ej: "F001-00000127"
  comprobanteAfectadoId: number
  codMotivo: string             // "01".."10"
  desMotivo: string
  client: NotaCreditoClient
  company: NotaCreditoCompany
  formaPago: {
    moneda: string
    tipo: string
  }
  mtoOperGravadas: number
  mtoOperExoneradas: number
  mtoOperInafectas: number
  mtoOperGratuitas: number
  mtoIGV: number
  totalIcbper: number
  valorVenta: number
  subTotal: number
  mtoImpVenta: number
  details: NotaCreditoDetalle[]
  legends: NotaCreditoLegend[]
}