export type Periodo = 'hoy' | 'semana' | 'mes' | 'año' | 'personalizado'

// ── KPI ────────────────────────────────────────────────────────────────────────
export interface KpiData {
  totalVentas: number
  totalIGV: number
  totalDocumentos: number
  totalVentasAnterior: number
  totalIGVAnterior: number
  totalDocumentosAnterior: number
}

// ── Gráfico ────────────────────────────────────────────────────────────────────
export interface GraficoBarra {
  etiqueta: string
  ventas: number
  igv: number
}

// ── Distribución donut ─────────────────────────────────────────────────────────
export interface DistribucionDocumentos {
  facturas: number
  boletas: number
  notasCredito: number
  notasDebito: number
}

// ── Tabla clientes ─────────────────────────────────────────────────────────────
export interface ClienteResumen {
  clienteRznSocial: string
  clienteNumDoc: string
  numDocs: number
  subtotal: number
  igv: number
  total: number
}

export interface TotalesClientes {
  totalDocs: number
  totalSubtotal: number
  totalIgv: number
  totalGeneral: number
}

// ── Response principal ─────────────────────────────────────────────────────────
export interface ReportesData {
  kpi: KpiData
  grafico: GraficoBarra[]
  distribucion: DistribucionDocumentos
  topClientes: ClienteResumen[]
  totalesClientes: TotalesClientes
}

// ── Export Excel ───────────────────────────────────────────────────────────────
export interface ClienteExport extends ClienteResumen {}

// ── Params hooks ───────────────────────────────────────────────────────────────
export interface ReportesEmpresaParams {
  ruc: string
  periodo: Periodo
  desde?: string | null
  hasta?: string | null
  limite?: number
  usuarioId?: number | null
}

export interface ReportesSucursalParams {
  sucursalId: number
  periodo: Periodo
  desde?: string | null
  hasta?: string | null
  limite?: number
  usuarioId?: number | null
}