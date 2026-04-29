"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    ChevronDown, RefreshCw, Mail, MessageCircle, CheckCircle2, X,
    Eye, Check, Filter, Search, MoreHorizontal, RotateCcw, Layers, Ban,
    FileText,
    Plus
} from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast'
import { cn } from '@/app/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { Comprobante } from './gestionComprobantes/Comprobante';
import { useSucursalRuc } from '../operaciones/boleta/gestionBoletas/useSucursalRuc';
import axios from 'axios';

import { useComprobantesEmpresaListado } from './gestionComprobantes/gestionComprobantesLista/UseComprobantesEmpresaListado';
import { useComprobantesEmpresaClienteListado } from './gestionComprobantes/gestionComprobantesLista/UseComprobantesEmpresaClienteListado';
import { useComprobantesEmpresaUsuarioListado } from './gestionComprobantes/gestionComprobantesLista/UseComprobantesEmpresaUsuarioListado';
import { useComprobantesSucursalListado } from './gestionComprobantes/gestionComprobantesLista/UseComprobantesSucursalListado';
import { useComprobanteDetalles } from './gestionComprobantes/gestionComprobantesLista/UseComprobanteDetalles';
import { ComprobanteListado, ComprobanteDetalles } from './gestionComprobantes/Comprobante';

import { useComprobanteUnico } from './gestionComprobantes/UseComprobanteUnico';
import { useComprobantesClienteSucursalListado } from './gestionComprobantes/gestionComprobantesLista/UseComprobantesClienteSucursalListado';

import { ModalDetalle } from '@/app/components/modalVerComprobantes/ModalDetalle'
import { ModalEnvioCorreoWhatsapp } from '@/app/components/modalVerComprobantes/ModalEnvioCorreoWhatsapp';
import { tipoLabel, formatFecha, formatFechaHora, COLORS } from './gestionComprobantes/helpers';
import { useRouter } from 'next/navigation'
import { Card } from '@/app/components/ui/Card';
import { createPortal } from 'react-dom';
import { Button } from '@/app/components/ui/Button';

// ─── Constantes filtros ───────────────────────────────────────────────────────
const TIPOS_OPTS = ['Todos', 'Factura', 'Boleta', 'Nota de Crédito', 'Nota de Débito'];
const ESTADOS_OPTS = ['Todos', 'Aceptado', 'Pendiente', 'Rechazado'];
const ESTADO_COLORS_MAP: Record<string, string> = { Aceptado: 'bg-emerald-500', Pendiente: 'bg-amber-400', Rechazado: 'bg-red-500' };

// ─── Page Principal ───────────────────────────────────────────────────────────
export default function VerComprobantesPage() {
    const router = useRouter()
    const { accessToken, user } = useAuth();
    const { showToast } = useToast();
    const isSuperAdmin = user?.rol === 'superadmin';
    const rucEmpresa: string = user?.ruc ?? '';
    const sucursalId: number = Number(user?.sucursalID ?? 0);

    // ── Hooks de datos ──
    const hookEmpresa = useComprobantesEmpresaListado();
    const hookSucursal = useComprobantesSucursalListado();
    const hookCliente = useComprobantesEmpresaClienteListado();
    const hookClienteSucursal = useComprobantesClienteSucursalListado()
    const hookUsuario = useComprobantesEmpresaUsuarioListado();
    const hookDetalles = useComprobanteDetalles();
    const hookUnico = useComprobanteUnico();

    const { sucursales, loadingSucursales } = useSucursalRuc(isSuperAdmin);

    // ── Estado local ──
    const [comprobantes, setComprobantes] = useState<ComprobanteListado[]>([]);
    const [detalle, setDetalle] = useState<ComprobanteListado | null>(null);
    const [detalleCompleto, setDetalleCompleto] = useState<ComprobanteDetalles | null>(null);
    const [search, setSearch] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [modalEnvio, setModalEnvio] = useState<{ comprobante: ComprobanteListado; tipo: 'email' | 'whatsapp' } | null>(null);

    // ── Filtros cabecera ──
    const [showAvanzado, setShowAvanzado] = useState(false);
    const [sucursalFiltro, setSucursalFiltro] = useState<number | null>(null);

    // Opciones avanzadas
    const [modoAvanzado, setModoAvanzado] = useState<'fechas' | 'unico' | 'cliente' | 'usuario'>('fechas')
    const [avSerie, setAvSerie] = useState('');
    const [avNumero, setAvNumero] = useState('');
    const [avClienteDoc, setAvClienteDoc] = useState('');
    const [avUsuarioId, setAvUsuarioId] = useState('');
    const [avFechaDesde, setAvFechaDesde] = useState('');
    const [avFechaHasta, setAvFechaHasta] = useState('');

    //Validar fechas
    const hoy = new Date().toISOString().split('T')[0]

    // ── Loading del hook activo ──
    const loading = hookSucursal.loading 
        || hookEmpresa.loading 
        || hookUnico.loading 
        || hookCliente.loading 
        || hookUsuario.loading

    // ── Carga inicial ──
    const cargarComprobantes = useCallback(async () => {
        let data: ComprobanteListado[] = []
        if (isSuperAdmin && sucursalFiltro) {
            data = await hookSucursal.fetchComprobantes({ sucursalId: sucursalFiltro, fechaDesde: null, fechaHasta: null })
        } else if (isSuperAdmin) {
            data = await hookEmpresa.fetchComprobantes({ ruc: rucEmpresa, fechaDesde: null, fechaHasta: null })
        } else {
            data = await hookSucursal.fetchComprobantes({ sucursalId, fechaDesde: null, fechaHasta: null })
        }
        setComprobantes(data)
    }, [isSuperAdmin, sucursalFiltro, rucEmpresa, sucursalId])

    useEffect(() => {
    if (!user || !accessToken) return
    cargarComprobantes()
    }, [user, accessToken, cargarComprobantes])

    useEffect(() => {
    if (!user || !accessToken || !isSuperAdmin) return
    cargarComprobantes()
    }, [sucursalFiltro])

    const abrirDetalle = useCallback(async (c: ComprobanteListado) => {
        setDetalle(c);
        setDetalleCompleto(null);
        const data = await hookDetalles.fetchDetalles(c.comprobanteId);
        if (data) setDetalleCompleto(data);
    }, [hookDetalles]);

    const buscarAvanzado = async () => {
        let data: ComprobanteListado[] = []
        if (modoAvanzado === 'fechas') {
            if (isSuperAdmin && sucursalFiltro) {
                data = await hookSucursal.fetchComprobantes({ sucursalId: sucursalFiltro, fechaDesde: avFechaDesde || null, fechaHasta: avFechaHasta || null })
            } else if (isSuperAdmin) {
                data = await hookEmpresa.fetchComprobantes({ ruc: rucEmpresa, fechaDesde: avFechaDesde || null, fechaHasta: avFechaHasta || null })
            } else {
                data = await hookSucursal.fetchComprobantes({ sucursalId, fechaDesde: avFechaDesde || null, fechaHasta: avFechaHasta || null })
            }
            setComprobantes(data)
        } else if (modoAvanzado === 'unico') {
            if (!avSerie || !avNumero) { showToast('Ingrese serie y número', 'error'); return }
            setSucursalFiltro(null)
            const resultado = await hookUnico.fetchComprobante({ ruc: rucEmpresa, serie: avSerie, numero: Number(avNumero) })
            if (resultado) {
                setComprobantes([resultado])
            } else {
                setComprobantes([])
                showToast('No se encontró el comprobante', 'error')
            }
        } else if (modoAvanzado === 'cliente') {
            if (!avClienteDoc) { showToast('Ingrese el número de documento del cliente', 'error'); return }
            if (isSuperAdmin) {
                setSucursalFiltro(null)
                data = await hookCliente.fetchComprobantes({ rucEmpresa, clienteNumDoc: avClienteDoc, fechaDesde: avFechaDesde || null, fechaHasta: avFechaHasta || null })
            } else {
                data = await hookClienteSucursal.fetchComprobantes({ sucursalId, clienteNumDoc: avClienteDoc, fechaDesde: avFechaDesde || null, fechaHasta: avFechaHasta || null })
            }
            setComprobantes(data)
        } else if (modoAvanzado === 'usuario') {
            if (!avUsuarioId) { showToast('Ingrese el ID de usuario', 'error'); return }
            setSucursalFiltro(null)
            data = await hookUsuario.fetchComprobantes({ rucEmpresa, usuarioId: Number(avUsuarioId), fechaDesde: avFechaDesde || null, fechaHasta: avFechaHasta || null })
            setComprobantes(data)
        }
    }

    // ── Filtrado local ──
    const filtered = useMemo(() => {
        return comprobantes.filter(c => {
            const tipo = tipoLabel(c.tipoComprobante)
            const matchSearch =
                (c.cliente?.razonSocial ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (c.cliente?.numeroDocumento ?? '').includes(search) ||
                (c.numeroCompleto ?? '').toLowerCase().includes(search.toLowerCase())
            const matchTipo = filtroTipo === 'Todos' || tipo === filtroTipo
            const estadoLabel = c.estadoSunat === 'ACEPTADO' ? 'Aceptado' : c.estadoSunat === 'RECHAZADO' ? 'Rechazado' : 'Pendiente'
            const matchEstado = filtroEstado === 'Todos' || estadoLabel === filtroEstado
            return matchSearch && matchTipo && matchEstado
        })
    }, [comprobantes, search, filtroTipo, filtroEstado])

    // ── Paginación ──
    const paginated = filtered;    
    // ── Evnviar SUNAT ──
    const enviarSunat = async (c: ComprobanteListado) => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${c.comprobanteId}/enviar-sunat`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const tipoDoc = tipoLabel(c.tipoComprobante)
            setComprobantes(prev => prev.map(comp => {
                if (comp.comprobanteId !== c.comprobanteId) return comp
                return {
                    ...comp,
                    estadoSunat: res.data.estadoSunat ?? comp.estadoSunat,
                    codigoRespuestaSunat: res.data.codigoRespuesta ?? comp.codigoRespuestaSunat,
                    mensajeRespuestaSunat: res.data.mensajeRespuesta ?? comp.mensajeRespuestaSunat,
                }
            }))

            if (res.data.exitoso) {
                showToast(res.data.mensaje ?? `${tipoDoc} enviada correctamente a SUNAT`, 'success')
            } else {
                showToast(`${tipoDoc} ${c.numeroCompleto} rechazada por SUNAT`, 'error')
            }

        } catch {
            showToast('Error al enviar a SUNAT', 'error')
        }
    }
    
    const editarenviarSunat = (c: ComprobanteListado) => {
    switch (c.tipoComprobante) {
        case '01':
        router.push(`/factunet/operaciones/factura?comprobanteId=${c.comprobanteId}&serie=${c.serie}&correlativo=${c.correlativo}&ruc=${c.company.numeroDocumento}&establecimiento=${c.company.establecimientoAnexo}`);
        break;
        case '03':
        router.push(`/factunet/operaciones/boleta?comprobanteId=${c.comprobanteId}`);
        break;
        case '07':
        router.push(`/factunet/operaciones/nota-credito?serie=${c.serie}&correlativo=${c.correlativo}&ruc=${c.company.numeroDocumento}&establecimiento=${c.company.establecimientoAnexo}`);
        break;
        case '08':
        router.push(`/factunet/operaciones/nota-debito?serie=${c.serie}&correlativo=${c.correlativo}&ruc=${c.company.numeroDocumento}&establecimiento=${c.company.establecimientoAnexo}`);
        break;
        default:
        break;
    }
    };

    const generarNotaCredito = (c: ComprobanteListado) => {
        router.push(`/factunet/operaciones/nota-credito?serie=${c.serie}&correlativo=${c.correlativo}&ruc=${c.company.numeroDocumento}&establecimiento=${c.company.establecimientoAnexo}`)
    }

    const generarNotaDebito = (c: ComprobanteListado) => {
        router.push(`/factunet/operaciones/nota-debito?serie=${c.serie}&correlativo=${c.correlativo}&ruc=${c.company.numeroDocumento}&establecimiento=${c.company.establecimientoAnexo}`)
    }

    // ── Anular (vacío por ahora) ──
    const anularComprobante = async (_c: ComprobanteListado) => {
        // TODO: implementar cuando esté el endpoint
    };

    // ── Agregar a resumen (vacío) ──
    const agregarResumen = async (_c: ComprobanteListado) => {
        // TODO: implementar cuando esté el endpoint
    };

    return (
        <div className="space-y-3 animate-in fade-in duration-500">

            {/* Modales */}
            {detalle && (
                <ModalDetalle
                    comprobante={{
                        ...detalle,
                        details:      detalleCompleto?.details      ?? [],
                        pagos:        detalleCompleto?.pagos        ?? [],
                        cuotas:       detalleCompleto?.cuotas       ?? [],
                        legends:      detalleCompleto?.legends      ?? [],
                        guias:        detalleCompleto?.guias        ?? [],
                        detracciones: detalleCompleto?.detracciones ?? [],
                    } as unknown as Comprobante}
                    ruc={rucEmpresa}
                    accessToken={accessToken ?? ''}
                    loadingDetalles={hookDetalles.loading}
                    nombreSucursal={isSuperAdmin 
                        ? sucursales.find((s: any) => s.codEstablecimiento === detalle.company.establecimientoAnexo)?.nombre 
                        : undefined
                    }
                    onClose={() => { 
                        setDetalle(null); 
                        setDetalleCompleto(null); 
                        hookDetalles.reset(); 
                    }}
                />
            )}
            {modalEnvio && (
                <ModalEnvioCorreoWhatsapp
                    comprobante={modalEnvio.comprobante}
                    tipo={modalEnvio.tipo}
                    ruc={rucEmpresa}
                    accessToken={accessToken ?? ''}
                    onClose={() => setModalEnvio(null)}
                    onEnviado={(tipo, destinoUsado) => {
                        setComprobantes(prev => prev.map(c => {
                            if (c.comprobanteId !== modalEnvio!.comprobante.comprobanteId) return c
                            return {
                                ...c,
                                cliente: {
                                    ...c.cliente,
                                    ...(tipo === 'email' 
                                        ? { correo: destinoUsado, enviadoPorCorreo: true }
                                        : { whatsApp: destinoUsado, enviadoPorWhatsApp: true }
                                    )
                                }
                            }
                        }))
                        setModalEnvio(null)
                    }}
                />
            )}

            <div className="sticky top-0 z-20">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 pt-3">

                        {/* Div 1: Buscar + Filtros */}
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-auto sm:flex-1 min-w-48 max-w-sm">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar por cliente, RUC/DNI o N° comprobante..."
                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm text-sm" />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <DropdownFiltro label="Tipo de comprobante" value={filtroTipo} options={TIPOS_OPTS} onChange={v => { setFiltroTipo(v); }} />
                            <DropdownFiltro label="Estado SUNAT" value={filtroEstado} options={ESTADOS_OPTS} onChange={v => { setFiltroEstado(v); }} colorMap={ESTADO_COLORS_MAP} />
                            <button onClick={() => setShowAvanzado(o => !o)}
                                className={cn("flex items-center gap-2 px-3 py-2.5 text-sm font-medium border rounded-xl transition-all shadow-sm",
                                    showAvanzado ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")}>
                                <Filter size={14} /> Opciones avanzadas
                                <ChevronDown size={13} className={cn("transition-transform", showAvanzado && "rotate-180")} />
                            </button>

                            {/* Select sucursal superadmin — al costado de opciones avanzadas */}
                            {isSuperAdmin && (
                            <select
                                value={sucursalFiltro ?? ''}
                                onChange={e => setSucursalFiltro(e.target.value ? Number(e.target.value) : null)}
                                className="py-2.5 px-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 shadow-sm"
                            >
                                <option value="">Todas las sucursales</option>
                                {sucursales.map((s: any) => (
                                <option key={s.sucursalId} value={s.sucursalId}>
                                    {s.nombre ?? s.codEstablecimiento}
                                </option>
                                ))}
                            </select>
                            )}
                            {(filtroTipo !== 'Todos' || filtroEstado !== 'Todos') && (
                                <button onClick={() => { setFiltroTipo('Todos'); setFiltroEstado('Todos'); }}
                                    className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors">
                                    Limpiar
                                </button>
                            )}
                        </div>

                        {/* Div 2: Nuevo Comprobante */}
                        <div className="shrink-0">
                            <Button onClick={() => router.push("/factunet/operaciones")}>
                                <Plus className="w-4 h-4" /> Nuevo Comprobante
                            </Button>
                        </div>

                    </div>

                    {showAvanzado && (
                        <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit flex-wrap">
                                {([
                                    { key: 'fechas', label: 'Por fechas (Sucursal)' },
                                    { key: 'unico', label: 'Comprobante único' },
                                    { key: 'cliente', label: 'Por cliente' },
                                    ...(isSuperAdmin ? [{ key: 'usuario', label: 'Por usuario' }] : []),
                                ] as const).map(tab => (
                                    <button key={tab.key} onClick={() => {
                                        setModoAvanzado(tab.key as any)
                                        setAvSerie(''); setAvNumero(''); setAvClienteDoc('');
                                        setAvUsuarioId(''); setAvFechaDesde(''); setAvFechaHasta('')
                                    }}
                                        className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                            modoAvanzado === tab.key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100")}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-end gap-3">
                                {modoAvanzado === 'fechas' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fecha desde</label>
                                            <input type="date" value={avFechaDesde} max={hoy}
                                                onChange={e => { setAvFechaDesde(e.target.value); if (avFechaHasta && e.target.value > avFechaHasta) setAvFechaHasta('') }}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fecha hasta</label>
                                            <input type="date" value={avFechaHasta} min={avFechaDesde || undefined} max={hoy}
                                                onChange={e => setAvFechaHasta(e.target.value)}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                    </>
                                )}
                                {modoAvanzado === 'unico' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Serie</label>
                                            <input value={avSerie} onChange={e => setAvSerie(e.target.value)} placeholder="F001"
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-28" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Número</label>
                                            <input type="number" value={avNumero} onChange={e => setAvNumero(e.target.value)} placeholder="135"
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-28" />
                                        </div>
                                    </>
                                )}
                                {modoAvanzado === 'cliente' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nº Doc. Cliente</label>
                                            <input value={avClienteDoc} onChange={e => setAvClienteDoc(e.target.value)} placeholder="20601234567"
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-36" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fecha desde</label>
                                            <input type="date" value={avFechaDesde} max={hoy}
                                                onChange={e => { setAvFechaDesde(e.target.value); if (avFechaHasta && e.target.value > avFechaHasta) setAvFechaHasta('') }}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fecha hasta</label>
                                            <input type="date" value={avFechaHasta} min={avFechaDesde || undefined} max={hoy}
                                                onChange={e => setAvFechaHasta(e.target.value)}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                    </>
                                )}
                                {modoAvanzado === 'usuario' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">ID Usuario</label>
                                            <input type="number" value={avUsuarioId} onChange={e => setAvUsuarioId(e.target.value)} placeholder="1"
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-28" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fecha desde</label>
                                            <input type="date" value={avFechaDesde} max={hoy}
                                                onChange={e => { setAvFechaDesde(e.target.value); if (avFechaHasta && e.target.value > avFechaHasta) setAvFechaHasta('') }}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fecha hasta</label>
                                            <input type="date" value={avFechaHasta} min={avFechaDesde || undefined} max={hoy}
                                                onChange={e => setAvFechaHasta(e.target.value)}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                    </>
                                )}
                                <button onClick={buscarAvanzado} disabled={loading}
                                    className={cn("flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors self-end", COLORS.btnPrimary, loading && COLORS.btnDisabled)}>
                                    <Search size={14} /> Buscar
                                </button>
                                <button onClick={() => {
                                    setAvSerie(''); setAvNumero(''); setAvClienteDoc(''); setAvUsuarioId('');
                                    setAvFechaDesde(''); setAvFechaHasta(''); setSucursalFiltro(null); cargarComprobantes();
                                }} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors self-end pb-2">
                                    <X size={12} /> Limpiar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Contador ── */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    Total <span className="font-semibold text-gray-900">{paginated.length}</span> comprobantes
                </p>
                {(!!search || filtroTipo !== 'Todos' || filtroEstado !== 'Todos') && filtered.length === 0 && (
                    <p className="text-sm text-amber-600 font-medium">Sin resultados para esta búsqueda</p>
                )}
            </div>

            <style>{`
                .comp-table tbody {
                    display: block;
                    overflow-y: auto;
                    max-height: calc(100vh - 295px);
                    scrollbar-width: thin;
                    scrollbar-color: #CBD5E1 transparent;
                }
                .comp-table-avanzado tbody {
                    max-height: calc(100vh - 425px);
                }
                .comp-table thead tr,
                .comp-table tbody tr {
                    display: table;
                    width: 100%;
                    table-layout: fixed;
                }
                .comp-table thead {
                    width: 100%;
                }
            `}</style>

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={cn("w-full text-left border-collapse comp-table", showAvanzado && "comp-table-avanzado")}>
                        <thead>
                            <tr className="bg-gray-100" style={{borderTopLeftRadius: '12px', borderTopRightRadius: '12px', overflow: 'hidden'}}>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">FECHA</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-52">COMPROBANTE</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-50">CLIENTE</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-16">PDF</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-16">XML</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-16">CDR</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-27.5">SUNAT</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-21">CORREO</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-24">WHATSAPP</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-19">VER</th>
                                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-21">OPCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw size={24} className="animate-spin text-blue-400" />
                                            <span className="text-sm text-gray-400">Cargando comprobantes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-16 text-center text-sm text-gray-400">
                                        No se encontraron comprobantes con ese criterio.
                                    </td>
                                </tr>
                            ) : paginated.map((doc) => (
                                <tr key={doc.comprobanteId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4 text-sm text-gray-900 font-medium whitespace-nowrap w-32">{formatFecha(doc.fechaCreacion)}</td>
                                    <td className="px-5 py-4 whitespace-nowrap w-52">
                                        <p className="text-sm font-medium text-gray-900">{doc.numeroCompleto}</p>
                                        <p className="text-xs text-gray-400">{tipoLabel(doc.tipoComprobante)}</p>
                                    </td>
                                    <td className="px-5 py-4 w-50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{doc.cliente.numeroDocumento}</span>
                                            <span className="text-sm text-gray-600">{doc.cliente.razonSocial}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center w-16"><div className="flex justify-center"><StatusIcon type="pdf" status="available" onClick={() => abrirDetalle(doc)} /></div></td>
                                    <td className="px-5 py-4 text-center w-16"><div className="flex justify-center"><StatusIcon type="xml" status="available" /></div></td>
                                    <td className="px-5 py-4 text-center w-16"><div className="flex justify-center"><StatusIcon type="cdr" status="available" /></div></td>
                                    <td className="px-5 py-4 text-center w-27.5"><div className="flex justify-center"><BadgeSunat estado={doc.estadoSunat} /></div></td>
                                    <td className="px-5 py-4 text-center w-21">
                                        <div className="flex justify-center">
                                            <BtnEnvio tipo="email" enviado={doc.cliente.enviadoPorCorreo} fecha={formatFechaHora(doc.fechaCreacion)} onClick={() => setModalEnvio({ comprobante: doc, tipo: 'email' })} />
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center w-24">
                                        <div className="flex justify-center">
                                            <BtnEnvio tipo="whatsapp" enviado={doc.cliente.enviadoPorWhatsApp} fecha={formatFechaHora(doc.fechaCreacion)} onClick={() => setModalEnvio({ comprobante: doc, tipo: 'whatsapp' })} />
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center w-19">
                                        <button onClick={() => abrirDetalle(doc)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                            <Eye size={13} /> Ver
                                        </button>
                                    </td>
                                    <td className="px-5 py-4 text-center w-21">
                                        <div className="flex justify-center">
                                            <DropdownOpciones
                                                comprobante={doc}
                                                onEnviarSunat={() => enviarSunat(doc)}
                                                onEditarEnviarSunat={() => editarenviarSunat(doc)}
                                                onResumen={() => agregarResumen(doc)}
                                                onAnular={() => anularComprobante(doc)}
                                                onGenerarNotaCredito={() => generarNotaCredito(doc)}
                                                onGenerarNotaDebito={() => generarNotaDebito(doc)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}


// ─── DropdownFiltro ───────────────────────────────────────────────────────────
interface DropdownFiltroProps {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
    colorMap?: Record<string, string>;
}

const DropdownFiltro = ({ label, value, options, onChange, colorMap }: DropdownFiltroProps) => {
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
            <button onClick={() => setOpen(o => !o)}
                className={cn("flex items-center gap-2 pl-3 pr-2.5 py-2 text-sm font-medium border rounded-lg outline-none transition-all shadow-sm whitespace-nowrap",
                    active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")}>
                {active ? value : label}
                {active
                    ? <X size={13} className="text-white/80" onClick={e => { e.stopPropagation(); onChange('Todos'); }} />
                    : <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />}
            </button>
            {open && (
                <div className="absolute top-full mt-1.5 left-0 z-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-45">
                    {options.map(opt => (
                        <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                            className={cn("w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors text-left",
                                value === opt ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-50")}>
                            <span className="flex items-center gap-2">
                                {colorMap && opt !== 'Todos' && <span className={cn("w-2 h-2 rounded-full", colorMap[opt])} />}
                                {opt}
                            </span>
                            {value === opt && <Check size={13} className="text-blue-600 shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── BadgeSunat ───────────────────────────────────────────────────────────────
const BadgeSunat = ({ estado }: { estado: string }) => {
    const cfg = COLORS.sunat[estado as keyof typeof COLORS.sunat] ?? COLORS.sunat.PENDIENTE;
    const icon = estado === 'ACEPTADO' ? <CheckCircle2 size={11} /> : estado === 'RECHAZADO' ? <X size={11} /> : <RefreshCw size={11} />;
    const label = estado === 'ACEPTADO' ? 'Aceptado' : estado === 'RECHAZADO' ? 'Rechazado' : 'Pendiente';
    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap", cfg.badge)}>
            {icon} {label}
        </span>
    );
};

// ─── BtnEnvio ─────────────────────────────────────────────────────────────────
const BtnEnvio = ({ tipo, enviado, fecha, onClick }: { tipo: 'email' | 'whatsapp'; enviado: boolean; fecha?: string; onClick: () => void; }) => {
    const esEmail = tipo === 'email';
    return (
        <div className="flex flex-col items-center gap-1">
            <button onClick={onClick}
                title={enviado ? `Enviado el ${fecha}. Click para reenviar` : `Enviar por ${esEmail ? 'correo' : 'WhatsApp'}`}
                className={cn("relative p-2 rounded-xl transition-all", enviado ? (esEmail ? COLORS.email.active : COLORS.whatsapp.active) : (esEmail ? COLORS.email.inactive : COLORS.whatsapp.inactive))}>
                {esEmail ? <Mail size={17} /> : <MessageCircle size={17} />}
                {enviado && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" strokeWidth={2.5} />
                    </span>
                )}
            </button>
            {enviado && <span className={cn("text-[10px] font-medium leading-none", esEmail ? "text-blue-500" : "text-green-500")}>Enviado</span>}
        </div>
    );
};

// ─── StatusIcon ───────────────────────────────────────────────────────────────
const StatusIcon = ({ type, status, onClick }: { type: 'pdf' | 'xml' | 'cdr'; status: 'available' | 'pending'; onClick?: () => void; }) => {
    if (type === 'pdf') {
        return (
            <button onClick={onClick} className={COLORS.pdf.btn} title="Ver PDF">
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" className="w-5 h-5 opacity-90" alt="PDF" />
            </button>
        );
    }
    return (
        <button className={COLORS.pdf.btn}>
            <RefreshCw size={18} className={cn("transition-colors", status === 'available' ? "text-emerald-500" : "text-gray-300")} />
        </button>
    );
};

// ─── Dropdown Opciones (...) ──────────────────────────────────────────────────
interface DropdownOpcionesProps {
    comprobante: ComprobanteListado;
    onEnviarSunat: () => void;
    onEditarEnviarSunat: () => void;
    onResumen: () => void;
    onAnular: () => void;
    onGenerarNotaCredito: () => void;
    onGenerarNotaDebito: () => void;
}

const DropdownOpciones = ({ comprobante, onEnviarSunat, onEditarEnviarSunat, onResumen, onAnular, onGenerarNotaCredito, onGenerarNotaDebito }: DropdownOpcionesProps) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null); // ← AGREGAR ESTA REF
    const esAceptado = comprobante.estadoSunat === 'ACEPTADO';
    const esPendiente = comprobante.estadoSunat === 'PENDIENTE';
    const esRechazado = comprobante.estadoSunat === 'RECHAZADO';
    const esFacturaOBoleta = comprobante.tipoComprobante === '01' || comprobante.tipoComprobante === '03';

    const handleOpen = () => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPos({
                top: rect.bottom + window.scrollY, 
                left: rect.left + window.scrollX - 180,
            })
        }
        setOpen(o => !o)
    }

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            // ← AHORA VERIFICA AMBAS REFS
            if (
                btnRef.current && !btnRef.current.contains(e.target as Node) &&
                menuRef.current && !menuRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <>
            <button
                ref={btnRef}
                onClick={handleOpen}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
                <MoreHorizontal size={16} />
            </button>

            {open && createPortal(
                <div
                    ref={menuRef} // ← ASIGNAR REF AQUÍ
                    style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
                    className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-50"
                >
                    {esPendiente && (
                        <button onClick={() => { onEnviarSunat(); setOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50">
                            <RotateCcw size={14} className="text-blue-500" />
                            Enviar a SUNAT
                        </button>
                    )}
                    {comprobante.tipoComprobante === '03' && esPendiente && (
                        <button onClick={() => { onResumen(); setOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50">
                            <Layers size={14} className="text-indigo-500" />
                            Agregar a envío por resumen
                        </button>
                    )}
                    {esRechazado && (
                        <button onClick={() => { onEditarEnviarSunat(); setOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50">
                            <RotateCcw size={14} className="text-amber-500" />
                            Editar y reenviar
                        </button>
                    )}
                    {esFacturaOBoleta && esAceptado && (
                        <>
                            <div className="border-t border-gray-100" />
                            <button onClick={() => { onGenerarNotaCredito(); setOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50">
                                <FileText size={14} className="text-purple-500" />
                                Generar Nota de Crédito
                            </button>
                            <button onClick={() => { onGenerarNotaDebito(); setOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50">
                                <FileText size={14} className="text-orange-500" />
                                Generar Nota de Débito
                            </button>
                        </>
                    )}
                    {esFacturaOBoleta && esAceptado && (
                        <>
                            <div className="border-t border-gray-100" />
                            <button onClick={() => { onAnular(); setOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-red-600 hover:bg-red-50">
                                <Ban size={14} className="text-red-500" />
                                Anular
                            </button>
                        </>
                    )}
                </div>,
                document.body
            )}
        </>
    )
}