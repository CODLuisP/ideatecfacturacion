export const ESTADO_CUOTA_COLORS: Record<string, string> = {
  PAGADO:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  PARCIAL:   'bg-amber-50 text-amber-700 border-amber-200',
  PENDIENTE: 'bg-red-50 text-red-700 border-red-200',
}

export const MEDIO_PAGO_OPTS = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'YAPE',
  'PLIN',
  'TARJETA',
  'CHEQUE',
  'OTRO',
]

export const formatFecha = (fecha: string | null): string => {
  if (!fecha) return '-'
  try {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  } catch { return '-' }
}

export const formatMoneda = (monto: number | string | null, moneda = 'PEN'): string => {
  if (monto === null || monto === undefined) return '-'
  const simbolo = moneda === 'USD' ? '$' : 'S/'
  return `${simbolo} ${parseFloat(String(monto)).toFixed(2)}`
}

export const tipoComprobanteLabel = (tipo: string): string => {
  const map: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta',
  }
  return map[tipo] ?? 'Comprobante'
}

export const getEstadoCuota = (cuota: { estado: string | null; montoPagado: number | null }): string => {
  if (cuota.estado) return cuota.estado
  if (!cuota.montoPagado || cuota.montoPagado === 0) return 'PENDIENTE'
  return 'PENDIENTE'
}

// Tasa descuento diaria por pronto pago (estática, luego vendrá del contexto empresa)
// export const TASA_DESCUENTO_DIARIA = 0.0005  // 0.05% diario ejemplo
export const TASA_DESCUENTO_DIARIA = 0.000  // 0.0% diario Uso actual, activar anterior y desactivar esto para activar tasa.

// Tasa penalidad diaria por pago tardío (estática, luego vendrá del contexto empresa)
// export const TASA_PENALIDAD_DIARIA = 0.0008  // 0.08% diario
export const TASA_PENALIDAD_DIARIA = 0.000  // 0.0% diario Uso actual, activar anterior y desactivar esto para activar tasa.

export const getCuotaVencida = (fechaVencimiento: string): boolean => {
  const hoy = new Date().toISOString().split('T')[0]
  const venc = fechaVencimiento.split('T')[0]
  return venc < hoy
}

export const getDiasVencida = (fechaVencimiento: string): number => {
  const hoy = new Date().toISOString().split('T')[0]
  const venc = fechaVencimiento.split('T')[0]
  if (venc >= hoy) return 0
  const diff = new Date(hoy).getTime() - new Date(venc).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export const calcularPenalidad = (
  monto: number,
  fechaVencimiento: string,
  fechaPago: string
): {
  diasMora: number
  porcentajePenalidad: number
  montoPenalidad: number
  montoFinal: number
} => {
  const vencimiento = new Date(fechaVencimiento)
  vencimiento.setHours(0, 0, 0, 0)
  const pago = new Date(fechaPago)
  pago.setHours(0, 0, 0, 0)
  const dias = Math.max(0, Math.floor((pago.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24)))
  const porcentaje = parseFloat((TASA_PENALIDAD_DIARIA * dias * 100).toFixed(2))
  const montoPenalidad = parseFloat((monto * TASA_PENALIDAD_DIARIA * dias).toFixed(2))
  const montoFinal = parseFloat((monto + montoPenalidad).toFixed(2))
  return { diasMora: dias, porcentajePenalidad: porcentaje, montoPenalidad, montoFinal }
}

export const calcularDescuento = (
  monto: number,
  fechaVencimiento: string,
  fechaPago: string
): {
  diasAnticipacion: number
  porcentajeDescuento: number
  montoDescuento: number
  montoFinal: number
} => {
  const vencimiento = new Date(fechaVencimiento)
  vencimiento.setHours(0, 0, 0, 0)
  const pago = new Date(fechaPago)
  pago.setHours(0, 0, 0, 0)
  const dias = Math.max(0, Math.floor((vencimiento.getTime() - pago.getTime()) / (1000 * 60 * 60 * 24)))
  const porcentaje = parseFloat((TASA_DESCUENTO_DIARIA * dias * 100).toFixed(2))
  const montoDescuento = parseFloat((monto * TASA_DESCUENTO_DIARIA * dias).toFixed(2))
  const montoFinal = parseFloat((monto - montoDescuento).toFixed(2))
  return { diasAnticipacion: dias, porcentajeDescuento: porcentaje, montoDescuento, montoFinal }
}