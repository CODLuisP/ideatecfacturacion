export interface RendimientoVentas {
  fecha: string
  totalVentas: number
}

export interface ComprobanteReciente {
  comprobanteID: number
  numeroCompleto: string
  tipoComprobante: string
  clienteRznSocial: string
  fechaEmision: string
  importeTotal: number
  estadoSunat: string
}

export interface DashboardData {
  ventasDelDia: number
  facturasEmitidas: number
  boletasEmitidas: number
  notasCreditoEmitidas: number
  notasDebitoEmitidas: number
  rendimientoVentas: RendimientoVentas[]
  comprobantesRecientes: ComprobanteReciente[]
}