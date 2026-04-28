"use client";
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, X, Filter, ChevronDown, RefreshCw,
  DollarSign, Calendar, Check, Eye, CreditCard,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/app/components/ui/Toast';
import { Card } from '@/app/components/ui/Card';
import { useCuentasPorCobrar } from './gestionCuentasPorCobrar/UseCuentasPorCobrar';
import { useCuotasComprobante } from './gestionCuentasPorCobrar/UseCuotasComprobante';
import { usePagarCuota } from './gestionCuentasPorCobrar/UsePagarCuota';
import { CuentaPorCobrar, Cuota, PagarCuotaPayload } from './gestionCuentasPorCobrar/CuentasPorCobrar';
import { formatFecha, formatMoneda, tipoComprobanteLabel, getEstadoCuota, ESTADO_CUOTA_COLORS, getCuotaVencida, getDiasVencida } from './gestionCuentasPorCobrar/helpers';
import { ModalPagarCuota } from '@/app/components/modalCuentasPorCobrar/ModalPagarCuota';

const TIPO_OPTS = ['Todos', 'Factura', 'Boleta'];

export default function CuentasPorCobrarPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const rucEmpresa = user?.ruc ?? '';

  const hookCuentas = useCuentasPorCobrar();
  const hookCuotas  = useCuotasComprobante();
  const hookPagar   = usePagarCuota();

  const [cuentas, setCuentas]                           = useState<CuentaPorCobrar[]>([]);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<CuentaPorCobrar | null>(null);
  const [cuotas, setCuotas]                             = useState<Cuota[]>([]);
  const [cuotaPagar, setCuotaPagar]                     = useState<Cuota | null>(null);
  const [search, setSearch]                             = useState('');
  const [filtroTipo, setFiltroTipo]                     = useState('Todos');
  const [showAvanzado, setShowAvanzado]                 = useState(false);
  const [avFechaDesde, setAvFechaDesde]                 = useState('');
  const [avFechaHasta, setAvFechaHasta]                 = useState('');
  const [avClienteDoc, setAvClienteDoc]                 = useState('');
  const hoy = new Date().toISOString().split('T')[0];

  const cargar = async () => {
    const data = await hookCuentas.fetchCuentas({ empresaRuc: rucEmpresa });
    setCuentas(data);
  };

  useEffect(() => {
    if (!user || !accessToken) return;
    cargar();
  }, [user, accessToken]);

  const verCuotas = async (c: CuentaPorCobrar) => {
    setComprobanteSeleccionado(c);
    setCuotas([]);
    const data = await hookCuotas.fetchCuotas(c.comprobanteId);
    setCuotas(data);
  };

  const cerrarModal = () => {
    setComprobanteSeleccionado(null);
    setCuotas([]);
    hookCuotas.reset();
  };

  const buscarAvanzado = async () => {
    if (!avClienteDoc && !avFechaDesde && !avFechaHasta) {
      showToast('Ingrese al menos un criterio de búsqueda', 'error');
      return;
    }
    const data = await hookCuentas.fetchCuentas({
      empresaRuc: rucEmpresa,
      fechaInicio: avFechaDesde || null,
      fechaFin: avFechaHasta || null,
      clienteNumDoc: avClienteDoc || null,
    });
    setCuentas(data);
  };

  const limpiarAvanzado = () => {
    setAvFechaDesde('');
    setAvFechaHasta('');
    setAvClienteDoc('');
    cargar();
  };

  const filtered = useMemo(() => {
    return cuentas.filter(c => {
      const matchSearch =
        c.clienteRznSocial.toLowerCase().includes(search.toLowerCase()) ||
        c.clienteNumDoc.includes(search) ||
        c.numeroCompleto.toLowerCase().includes(search.toLowerCase());
      const matchTipo = filtroTipo === 'Todos' || tipoComprobanteLabel(c.tipoComprobante) === filtroTipo;
      return matchSearch && matchTipo;
    });
  }, [cuentas, search, filtroTipo]);

  const handlePagar = async (payload: PagarCuotaPayload) => {
    const ok = await hookPagar.pagarCuota(payload.cuotaId, payload);
    if (ok && comprobanteSeleccionado) {
      const data = await hookCuotas.fetchCuotas(comprobanteSeleccionado.comprobanteId);
      setCuotas(data);
      setCuotaPagar(null);
      // Refrescar listado para quitar comprobantes totalmente pagados
      cargar();
    }
  };

  const loading = hookCuentas.loading;

  return (
    <div className="space-y-3 animate-in fade-in duration-500">

      {/* Modal Pagar */}
      {cuotaPagar && comprobanteSeleccionado && (
        <ModalPagarCuota
          cuota={cuotaPagar}
          tipoMoneda={comprobanteSeleccionado.tipoMoneda}
          onClose={() => setCuotaPagar(null)}
          onConfirm={handlePagar}
          loading={hookPagar.loading}
          usuarioId={Number(user?.id ?? 0)}
        />
      )}

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por cliente, RUC/DNI o N° comprobante..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <DropdownFiltro label="Tipo" value={filtroTipo} options={TIPO_OPTS} onChange={setFiltroTipo} />
            <button
              onClick={() => setShowAvanzado(o => !o)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm font-medium border rounded-xl transition-all shadow-sm",
                showAvanzado ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              <Filter size={14} /> Filtros
              <ChevronDown size={13} className={cn("transition-transform", showAvanzado && "rotate-180")} />
            </button>
            {filtroTipo !== 'Todos' && (
              <button onClick={() => setFiltroTipo('Todos')} className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors">
                Limpiar
              </button>
            )}
          </div>
        </div>

        {showAvanzado && (
          <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nº Doc. Cliente</label>
                <input type="text" value={avClienteDoc} onChange={e => setAvClienteDoc(e.target.value)}
                  placeholder="RUC o DNI"
                  className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-64" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fecha desde</label>
                <input type="date" value={avFechaDesde} max={hoy}
                  onChange={e => { setAvFechaDesde(e.target.value); if (avFechaHasta && e.target.value > avFechaHasta) setAvFechaHasta(''); }}
                  className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fecha hasta</label>
                <input type="date" value={avFechaHasta} min={avFechaDesde || undefined} max={hoy}
                  onChange={e => setAvFechaHasta(e.target.value)}
                  className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
              </div>
              <button onClick={buscarAvanzado} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors self-end disabled:opacity-50">
                <Search size={14} /> Buscar
              </button>
              <button onClick={limpiarAvanzado}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors self-end pb-2">
                <X size={12} /> Limpiar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Total <span className="font-semibold text-gray-900">{filtered.length}</span> comprobantes a crédito
        </p>
      </div>

      {/* Tabla */}
      <style>{`
        .cpc-table tbody { display: block; overflow-y: auto; max-height: calc(100vh - 295px); scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent; }
        .cpc-table-avanzado tbody { max-height: calc(100vh - 380px); }
        .cpc-table thead tr, .cpc-table tbody tr { display: table; width: 100%; table-layout: fixed; }
        .cpc-table thead { width: 100%; }
      `}</style>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={cn("w-full text-left border-collapse cpc-table", showAvanzado && "cpc-table-avanzado")}>
            <thead>
              <tr className="bg-gray-100" style={{borderTopLeftRadius: '12px', borderTopRightRadius: '12px', overflow: 'hidden'}}>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Fecha</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">Comprobante</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 text-right">Importe</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 text-right">Crédito</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 text-center">Moneda</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40 text-center">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw size={24} className="animate-spin text-blue-400" />
                    <span className="text-sm text-gray-400">Cargando cuentas por cobrar...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-400">
                  No se encontraron comprobantes a crédito.
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.comprobanteId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 text-sm text-gray-900 font-medium whitespace-nowrap w-32">{formatFecha(c.fechaEmision)}</td>
                  <td className="px-5 py-4 whitespace-nowrap w-44">
                    <p className="text-sm font-medium text-gray-900">{c.numeroCompleto}</p>
                    <p className="text-xs text-gray-400">{tipoComprobanteLabel(c.tipoComprobante)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-gray-900">{c.clienteRznSocial}</p>
                    <p className="text-xs text-gray-400">{c.clienteNumDoc}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900 text-right whitespace-nowrap w-32">{formatMoneda(c.importeTotal, c.tipoMoneda)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-blue-700 text-right whitespace-nowrap w-32">
                    {formatMoneda((!c.montoCredito || c.montoCredito === 0) ? c.importeTotal : c.montoCredito, c.tipoMoneda)}
                  </td>
                  <td className="px-5 py-4 text-center w-20">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{c.tipoMoneda}</span>
                  </td>
                  <td className="px-5 py-4 text-center w-36">
                    <button
                      onClick={() => verCuotas(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Eye size={13} /> Ver cuotas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal detalle cuotas */}
      {comprobanteSeleccionado && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col animate-in zoom-in-95 duration-200" style={{ maxHeight: '90vh' }}>

            {/* Header */}
            <div className="bg-blue-600 rounded-t-2xl px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <DollarSign size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{comprobanteSeleccionado.numeroCompleto}</h3>
                  <p className="text-blue-200 text-xs mt-0.5">
                    {tipoComprobanteLabel(comprobanteSeleccionado.tipoComprobante)} · {formatFecha(comprobanteSeleccionado.fechaEmision)}
                  </p>
                </div>
              </div>
              <button onClick={cerrarModal} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X size={17} className="text-white" />
              </button>
            </div>

            {/* Datos cliente */}
            <div className="px-6 py-4 border-b border-gray-100 flex gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
                <p className="text-sm font-bold text-gray-900">{comprobanteSeleccionado.clienteRznSocial}</p>
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-gray-500">
                    <span className="font-bold text-gray-400">
                      {comprobanteSeleccionado.clienteNumDoc.length === 11 ? 'RUC' : 'DNI'}:
                    </span>{' '}
                    {comprobanteSeleccionado.clienteNumDoc}
                  </p>
                  {comprobanteSeleccionado.clienteCorreo?.trim() && (
                    <p className="text-xs text-gray-500">
                      <span className="font-bold text-gray-400">Correo:</span>{' '}
                      {comprobanteSeleccionado.clienteCorreo}
                    </p>
                  )}
                  {comprobanteSeleccionado.clienteWhatsApp?.trim() && (
                    <p className="text-xs text-gray-500">
                      <span className="font-bold text-gray-400">Tel:</span>{' '}
                      {comprobanteSeleccionado.clienteWhatsApp}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 shrink-0">
                <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center min-w-24">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Importe Total</p>
                  <p className="text-sm font-bold text-gray-900">{formatMoneda(comprobanteSeleccionado.importeTotal, comprobanteSeleccionado.tipoMoneda)}</p>
                </div>
                {comprobanteSeleccionado.montoCredito > 0 &&
                 (comprobanteSeleccionado.importeTotal - comprobanteSeleccionado.montoCredito) > 0 && (
                  <div className="bg-amber-50 rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center min-w-24">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Pago Inicial</p>
                    <p className="text-sm font-bold text-amber-600">{formatMoneda(comprobanteSeleccionado.importeTotal - comprobanteSeleccionado.montoCredito, comprobanteSeleccionado.tipoMoneda)}</p>
                  </div>
                )}
                <div className="bg-blue-50 rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center min-w-24">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Monto Crédito</p>
                  <p className="text-sm font-bold text-blue-700">
                    {formatMoneda(
                      (!comprobanteSeleccionado.montoCredito || comprobanteSeleccionado.montoCredito === 0)
                        ? comprobanteSeleccionado.importeTotal
                        : comprobanteSeleccionado.montoCredito,
                      comprobanteSeleccionado.tipoMoneda
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista cuotas */}
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cuotas</h4>
                <span className="text-xs text-gray-400">{cuotas.length} cuota(s)</span>
              </div>

              <div className="divide-y divide-gray-100">
                {hookCuotas.loading ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                    <RefreshCw size={24} className="animate-spin text-blue-400" />
                    <span className="text-sm text-gray-400">Cargando cuotas...</span>
                  </div>
                ) : cuotas.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-400">
                    No se encontraron cuotas.
                  </div>
                ) : cuotas.map((cuota, i) => {
                  const estado         = getEstadoCuota(cuota)
                  const colorBadge     = ESTADO_CUOTA_COLORS[estado] ?? ESTADO_CUOTA_COLORS.PENDIENTE
                  const vencida        = getCuotaVencida(cuota.fechaVencimiento) && estado !== 'PAGADO'
                  const diasVencida    = getDiasVencida(cuota.fechaVencimiento)
                  const montoPagadoAnt = cuota.montoPagado ?? 0
                  const montoFinal     = cuota.montoFinal ?? cuota.monto
                  const progreso       = montoFinal > 0 ? Math.min((montoPagadoAnt / montoFinal) * 100, 100) : 0
                  const yaEstaPagado   = estado === 'PAGADO'

                  return (
                    <div key={cuota.cuotaId} className={cn("py-4 transition-colors", vencida ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50/50")}>
                      <div className="flex items-start justify-between gap-4">

                        {/* Número + fecha */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                            yaEstaPagado ? "bg-emerald-100 text-emerald-700" :
                            vencida ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{cuota.numeroCuota}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Calendar size={11} /> Vence: {formatFecha(cuota.fechaVencimiento)}
                            </div>
                            {vencida && (
                              <p className="text-[10px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
                                <AlertTriangle size={11} /> Vencida hace {diasVencida} día(s)
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Montos */}
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Monto</p>
                            <p className="text-sm font-semibold text-gray-800">{formatMoneda(cuota.monto, comprobanteSeleccionado.tipoMoneda)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Pagado</p>
                            <p className="text-sm font-semibold text-emerald-600">{formatMoneda(montoPagadoAnt, comprobanteSeleccionado.tipoMoneda)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Restante</p>
                            <p className="text-sm font-semibold text-blue-600">{formatMoneda(montoFinal - montoPagadoAnt, comprobanteSeleccionado.tipoMoneda)}</p>
                          </div>
                        </div>

                        {/* Estado + acción */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap", colorBadge)}>
                            {estado}
                          </span>
                          {yaEstaPagado ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg">
                              <Check size={13} /> Pagado
                            </div>
                          ) : (
                            <button
                              onClick={() => setCuotaPagar(cuota)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors",
                                vencida ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                              )}
                            >
                              <CreditCard size={13} /> Pagar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Barra progreso */}
                      {progreso > 0 && (
                        <div className="mt-3 ml-12">
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Progreso de pago</span>
                            <span>{progreso.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className={cn("h-1.5 rounded-full transition-all", yaEstaPagado ? "bg-emerald-500" : vencida ? "bg-red-500" : "bg-blue-500")}
                              style={{ width: `${progreso}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Info último pago */}
                      {cuota.fechaPago && (
                        <div className="mt-2 ml-12 flex flex-wrap gap-3 text-[10px] text-gray-400">
                          <span>Último pago: {formatFecha(cuota.fechaPago)}</span>
                          {cuota.medioPago && <span>· {cuota.medioPago}</span>}
                          {cuota.entidadFinanciera && <span>· {cuota.entidadFinanciera}</span>}
                          {cuota.numeroOperacion && <span>· Op: {cuota.numeroOperacion}</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={cerrarModal}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <X size={15} /> Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// DropdownFiltro
interface DropdownFiltroProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

const DropdownFiltro = ({ label, value, options, onChange }: DropdownFiltroProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const active = value !== 'Todos';
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-2 pl-3 pr-2.5 py-2 text-sm font-medium border rounded-lg outline-none transition-all shadow-sm whitespace-nowrap",
          active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        )}
      >
        {active ? value : label}
        {active
          ? <X size={13} className="text-white/80" onClick={e => { e.stopPropagation(); onChange('Todos'); }} />
          : <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />}
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-36">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors text-left",
                value === opt ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
              )}
            >
              {opt}
              {value === opt && <Check size={13} className="text-blue-600 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};