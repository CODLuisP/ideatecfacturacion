'use client'
import React, { useState, useEffect } from 'react'
import { X, CreditCard, Calendar, DollarSign, AlertCircle, TrendingUp } from 'lucide-react'
import { cn } from '@/app/utils/cn'
import { formatFecha } from '@/app/factunet/comprobantes/gestionComprobantes/helpers'
import { Cuota, PagarCuotaPayload } from '@/app/factunet/cuentasporcobrar/gestionCuentasPorCobrar/CuentasPorCobrar'
import {
  calcularDescuento, calcularPenalidad,
  TASA_DESCUENTO_DIARIA, TASA_PENALIDAD_DIARIA,
  formatMoneda, MEDIO_PAGO_OPTS
} from '@/app/factunet/cuentasporcobrar/gestionCuentasPorCobrar/helpers'

interface ModalPagarCuotaProps {
  cuota: Cuota
  tipoMoneda: string
  onClose: () => void
  onConfirm: (payload: PagarCuotaPayload) => Promise<void>
  loading: boolean
  usuarioId: number
}

export const ModalPagarCuota = ({
  cuota, tipoMoneda, onClose, onConfirm, loading, usuarioId
}: ModalPagarCuotaProps) => {

  const hoy  = new Date().toISOString().split('T')[0]
  const venc = cuota.fechaVencimiento.split('T')[0]
  const estaVencida = venc < hoy

  // ── Flags para mostrar secciones según tasa configurada
  const mostrarDescuento = TASA_DESCUENTO_DIARIA > 0 && !estaVencida && hoy < venc
  const mostrarPenalidad = TASA_PENALIDAD_DIARIA > 0 && estaVencida

  const montoPagadoAnterior = cuota.montoPagado ?? 0
  const montoRestante = (cuota.montoFinal ?? cuota.monto) - montoPagadoAnterior

  const [montoPagado, setMontoPagado]             = useState(montoRestante.toFixed(2))
  const [fechaPago, setFechaPago]                 = useState(hoy)
  const [medioPago, setMedioPago]                 = useState('EFECTIVO')
  const [entidadFinanciera, setEntidadFinanciera] = useState('')
  const [numeroOperacion, setNumeroOperacion]     = useState('')
  const [observaciones, setObservaciones]         = useState('')
  const [aplicarDescuento, setAplicarDescuento]   = useState(mostrarDescuento)
  const [aplicarPenalidad, setAplicarPenalidad]   = useState(mostrarPenalidad)
  const [errors, setErrors]                       = useState<Record<string, string>>({})

  const [descuento, setDescuento] = useState({
    diasAnticipacion: 0, porcentajeDescuento: 0, montoDescuento: 0, montoFinal: cuota.monto
  })
  const [penalidad, setPenalidad] = useState({
    diasMora: 0, porcentajePenalidad: 0, montoPenalidad: 0, montoFinal: cuota.monto
  })

  const requiereEntidad = ['TRANSFERENCIA', 'TARJETA', 'CHEQUE'].includes(medioPago)

  useEffect(() => {
    if (!fechaPago) return

    const pagoStr = fechaPago
    const vencStr = venc

    const esPagoAntes   = pagoStr < vencStr
    const esPagoDespues = pagoStr > vencStr

    if (aplicarDescuento && esPagoAntes && TASA_DESCUENTO_DIARIA > 0) {
      const res = calcularDescuento(cuota.monto, cuota.fechaVencimiento, fechaPago)
      setDescuento(res)
      setMontoPagado(Math.max(0, res.montoFinal - montoPagadoAnterior).toFixed(2))
    } else {
      setDescuento({ diasAnticipacion: 0, porcentajeDescuento: 0, montoDescuento: 0, montoFinal: cuota.monto })
      if (!aplicarPenalidad) setMontoPagado(Math.max(0, montoRestante).toFixed(2))
    }

    if (aplicarPenalidad && esPagoDespues && TASA_PENALIDAD_DIARIA > 0) {
      const res = calcularPenalidad(cuota.monto, cuota.fechaVencimiento, fechaPago)
      setPenalidad(res)
      setMontoPagado(Math.max(0, res.montoFinal - montoPagadoAnterior).toFixed(2))
    } else {
      setPenalidad({ diasMora: 0, porcentajePenalidad: 0, montoPenalidad: 0, montoFinal: cuota.monto })
      if (!aplicarDescuento) setMontoPagado(Math.max(0, montoRestante).toFixed(2))
    }
  }, [fechaPago, aplicarDescuento, aplicarPenalidad])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    const monto = parseFloat(montoPagado)
    if (!montoPagado || isNaN(monto) || monto <= 0) errs.montoPagado = 'Ingrese un monto válido'
    if (!fechaPago) errs.fechaPago = 'Seleccione una fecha'
    if (!medioPago) errs.medioPago = 'Seleccione un medio de pago'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleConfirm = async () => {
    if (!validate()) return

    let montoFinalEfectivo     = cuota.montoFinal ?? cuota.monto
    let montoDescuentoEfectivo = 0
    let motivoDescuento        = null
    let diasAnticipacion       = 0
    let porcentajeDescuento    = 0
    let tasaUsada              = 0

    if (mostrarDescuento && aplicarDescuento && descuento.diasAnticipacion > 0) {
      montoFinalEfectivo     = descuento.montoFinal
      montoDescuentoEfectivo = descuento.montoDescuento
      motivoDescuento        = `Pronto pago ${descuento.diasAnticipacion} días antes`
      diasAnticipacion       = descuento.diasAnticipacion
      porcentajeDescuento    = descuento.porcentajeDescuento
      tasaUsada              = TASA_DESCUENTO_DIARIA
    } else if (mostrarPenalidad && aplicarPenalidad && penalidad.diasMora > 0) {
      montoFinalEfectivo     = penalidad.montoFinal
      montoDescuentoEfectivo = -penalidad.montoPenalidad
      motivoDescuento        = `Penalidad por mora ${penalidad.diasMora} días`
      diasAnticipacion       = -penalidad.diasMora
      porcentajeDescuento    = -penalidad.porcentajePenalidad
      tasaUsada              = TASA_PENALIDAD_DIARIA
    }

    const payload: PagarCuotaPayload = {
      cuotaId:             cuota.cuotaId,
      montoPagado:         parseFloat(montoPagado),
      fechaPago:           new Date(fechaPago).toISOString(),
      medioPago,
      entidadFinanciera:   entidadFinanciera || null,
      numeroOperacion:     numeroOperacion || null,
      observaciones:       observaciones || null,
      usuarioRegistroPago: usuarioId,
      tasaDescuentoDiaria: tasaUsada,
      diasAnticipacion,
      porcentajeDescuento,
      montoDescuento:      montoDescuentoEfectivo,
      motivoDescuento,
      montoFinal:          montoFinalEfectivo,
    }
    await onConfirm(payload)
  }

  // ── Switch component ──────────────────────────────────────────────────────
  const Switch = ({ value, onChange, colorOn = 'bg-emerald-500' }: {
    value: boolean
    onChange: (v: boolean) => void
    colorOn?: string
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 ease-in-out shrink-0 focus:outline-none",
        value ? colorOn : "bg-gray-200"
      )}
    >
      <span className={cn(
        "inline-block w-5 h-5 mt-0.5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out",
        value ? "translate-x-5" : "translate-x-0.5"
      )} />
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col animate-in zoom-in-95 duration-200" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className={cn("rounded-t-2xl px-6 pt-5 pb-4 flex items-center justify-between shrink-0",
          estaVencida ? "bg-red-600" : "bg-blue-600")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Registrar Pago</h2>
              <p className={cn("text-xs mt-0.5 flex items-center gap-1", estaVencida ? "text-red-200" : "text-blue-200")}>
                {cuota.numeroCuota} · Vence: {formatFecha(cuota.fechaVencimiento)}
                {estaVencida && (
                  <span className="inline-flex items-center gap-1 ml-1">
                    · <AlertCircle size={11} /> VENCIDA
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Alerta vencimiento */}
          {estaVencida && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">
                Esta cuota está vencida.
                {mostrarPenalidad && ` Puede aplicar una penalidad por mora (${(TASA_PENALIDAD_DIARIA * 100).toFixed(4)}% diario).`}
              </p>
            </div>
          )}

          {/* Resumen cuota */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Monto Total</p>
              <p className="text-sm font-bold text-gray-900">{formatMoneda(cuota.monto, tipoMoneda)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pagado</p>
              <p className="text-sm font-bold text-emerald-600">{formatMoneda(montoPagadoAnterior, tipoMoneda)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Restante</p>
              <p className="text-sm font-bold text-blue-700">{formatMoneda(montoRestante, tipoMoneda)}</p>
            </div>
          </div>

          {/* Fecha pago */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar size={11} /> Fecha de Pago <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={fechaPago}
              max={hoy}
              onChange={e => setFechaPago(e.target.value)}
              className={cn("w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:border-blue-400 text-sm",
                errors.fechaPago ? "border-rose-400" : "border-gray-200")}
            />
            {errors.fechaPago && <p className="text-xs text-rose-500">{errors.fechaPago}</p>}
          </div>

          {/* Descuento pronto pago — solo si tasa > 0 y paga antes */}
          {mostrarDescuento && (
            <div className="border border-emerald-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-emerald-50">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Descuento por pronto pago</span>
                  <span className="text-[10px] text-emerald-500">({(TASA_DESCUENTO_DIARIA * 100).toFixed(4)}% diario)</span>
                </div>
                <Switch value={aplicarDescuento} onChange={setAplicarDescuento} colorOn="bg-emerald-500" />
              </div>
              {aplicarDescuento && (
                <div className="px-4 py-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg px-2 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Días anticipados</p>
                      <p className="text-sm font-bold text-gray-800">{descuento.diasAnticipacion}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">% Descuento</p>
                      <p className="text-sm font-bold text-emerald-600">{descuento.porcentajeDescuento}%</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg px-2 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Monto final</p>
                      <p className="text-sm font-bold text-emerald-700">{formatMoneda(descuento.montoFinal, tipoMoneda)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Penalidad por mora — solo si tasa > 0 y está vencida */}
          {mostrarPenalidad && (
            <div className="border border-red-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-red-50">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-red-600" />
                  <span className="text-xs font-bold text-red-700">Penalidad por mora</span>
                  <span className="text-[10px] text-red-500">({(TASA_PENALIDAD_DIARIA * 100).toFixed(4)}% diario)</span>
                </div>
                <Switch value={aplicarPenalidad} onChange={setAplicarPenalidad} colorOn="bg-red-500" />
              </div>
              {aplicarPenalidad && (
                <div className="px-4 py-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg px-2 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Días de mora</p>
                      <p className="text-sm font-bold text-gray-800">{penalidad.diasMora}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">% Penalidad</p>
                      <p className="text-sm font-bold text-red-600">{penalidad.porcentajePenalidad}%</p>
                    </div>
                    <div className="bg-red-50 rounded-lg px-2 py-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Monto final</p>
                      <p className="text-sm font-bold text-red-700">{formatMoneda(penalidad.montoFinal, tipoMoneda)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Monto pagado */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Monto a Pagar <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={montoPagado}
              min={0}
              step="0.01"
              onChange={e => setMontoPagado(e.target.value)}
              className={cn("w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:border-blue-400 text-sm",
                errors.montoPagado ? "border-rose-400" : "border-gray-200")}
            />
            {errors.montoPagado && <p className="text-xs text-rose-500">{errors.montoPagado}</p>}
          </div>

          {/* Medio de pago */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Medio de Pago <span className="text-rose-500">*</span>
            </label>
            <select
              value={medioPago}
              onChange={e => setMedioPago(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-400 text-sm"
            >
              {MEDIO_PAGO_OPTS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Entidad + N° operación */}
          {requiereEntidad && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-1 duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Entidad</label>
                <input type="text" value={entidadFinanciera} onChange={e => setEntidadFinanciera(e.target.value)}
                  placeholder="Ej: BCP"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-400 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">N° Operación</label>
                <input type="text" value={numeroOperacion} onChange={e => setNumeroOperacion(e.target.value)}
                  placeholder="Ej: 123456"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-400 text-sm" />
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas adicionales del pago..."
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-400 text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 flex gap-2 border-t border-gray-100 shrink-0">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors",
              estaVencida ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading
              ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              : <CreditCard size={15} />}
            {loading ? 'Registrando...' : 'Confirmar Pago'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            <X size={15} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}