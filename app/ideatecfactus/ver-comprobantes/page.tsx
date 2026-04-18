"use client";
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    ChevronDown, RefreshCw, Mail, MessageCircle, CheckCircle2, X, Send,
    Eye, FileText, Calendar, Hash, Building2, Download, Check, Filter,
    Search, MoreHorizontal, RotateCcw, Layers, Ban, AlertCircle,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { Comprobante } from './gestionComprobantes/Comprobante';
import { useSucursalRuc } from '../operaciones/boleta/gestionBoletas/useSucursalRuc';
import axios from 'axios';
import { useComprobantesEmpresa } from './gestionComprobantes/UseComprobantesEmpresa';
import { useComprobantesEmpresaCliente } from './gestionComprobantes/UseComprobantesEmpresaCliente';
import { useComprobantesEmpresaUsuario } from './gestionComprobantes/UseComprobantesEmpresaUsuario';
import { useComprobantesSucursal } from './gestionComprobantes/UseComprobantesSucursal';
import { useComprobanteUnico } from './gestionComprobantes/UseComprobanteUnico';

// ─── Colores centralizados ────────────────────────────────────────────────────
const COLORS = {
    sunat: {
        ACEPTADO: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        PENDIENTE: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
        RECHAZADO: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    },
    tipo: {
        '01': 'Factura',
        '03': 'Boleta',
        '07': 'Nota de Crédito',
        '08': 'Nota de Débito',
    } as Record<string, string>,
    email: { active: 'bg-blue-50 hover:bg-blue-100 text-blue-600', inactive: 'hover:bg-gray-100 text-gray-400 hover:text-gray-600' },
    whatsapp: { active: 'bg-green-50 hover:bg-green-100 text-green-600', inactive: 'hover:bg-gray-100 text-gray-400 hover:text-gray-600' },
    pdf: { btn: 'p-1.5 hover:bg-gray-100 rounded-md transition-colors' },
    btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSecondary: 'border border-gray-200 hover:bg-gray-50 text-gray-700',
    btnGreen: 'bg-green-500 hover:bg-green-600 text-white',
    btnDisabled: 'opacity-40 cursor-not-allowed',
};

const TIPO_PAGO_MAP: Record<string, string> = {
    'Contado': 'Contado',
    'Credito': 'Crédito',
}

const limpiarMensajeSunat = (mensaje: string): string => {
    const idx = mensaje.indexOf(' - Detalle')
    return idx !== -1 ? mensaje.substring(0, idx) : mensaje
}

const TIPO_GUIA_MAP: Record<string, string> = {
    '09': 'Guía Transportista',
    '08': 'Guía Remitente',
}

const esBolsaPlastica = (descripcion: string): boolean =>
    descripcion.toUpperCase().includes('BOLSA PLASTICA') || descripcion.toUpperCase().includes('BOLSA PLÁSTICA')

const PDF_SIZES = ['A4', 'Carta', 'Ticket80mm', 'Ticket58mm', 'MediaCarta'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const tipoLabel = (tc: string) => COLORS.tipo[tc] ?? 'Comprobante';

const formatFecha = (fecha: string) => {
    try {
        return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return fecha; }
};

const formatFechaHora = (fecha: string) => {
    try {
        const d = new Date(fecha);
        return `${d.toLocaleDateString('es-PE')} ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
    } catch { return fecha; }
};

const padCorrelativo = (c: string) => c.padStart(8, '0');

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

// ─── DataCard ─────────────────────────────────────────────────────────────────
const DataCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="bg-gray-50 rounded-xl px-3.5 py-3">
        <div className="flex items-center gap-1.5 mb-1.5">{icon}<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p></div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{value}</p>
    </div>
);

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
    comprobante: Comprobante;
    onReenviar: () => void;
    onResumen: () => void;
    onAnular: () => void;
}

const DropdownOpciones = ({ comprobante, onReenviar, onResumen, onAnular }: DropdownOpcionesProps) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const esAceptado = comprobante.estadoSunat === 'ACEPTADO';
    const esPendienteORechazado = comprobante.estadoSunat === 'PENDIENTE' || comprobante.estadoSunat === 'RECHAZADO';

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                <MoreHorizontal size={16} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1.5 z-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-50">
                    {/* Reenviar */}
                    <button
                        onClick={() => { if (!esPendienteORechazado) return; onReenviar(); setOpen(false); }}
                        disabled={!esPendienteORechazado}
                        className={cn("w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors",
                            esPendienteORechazado ? "text-gray-700 hover:bg-gray-50" : cn("text-gray-300", COLORS.btnDisabled))}>
                        <RotateCcw size={14} className={esPendienteORechazado ? "text-blue-500" : "text-gray-300"} />
                        Reenviar a SUNAT
                    </button>
                    {/* Agregar a resumen */}
                    <button
                        disabled
                        className={cn("w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-gray-300", COLORS.btnDisabled)}>
                        <Layers size={14} className="text-gray-300" />
                        Agregar a envío por resumen
                    </button>
                    <div className="border-t border-gray-100" />
                    {/* Anular */}
                    <button
                        onClick={() => { if (!esAceptado) return; onAnular(); setOpen(false); }}
                        disabled={!esAceptado}
                        className={cn("w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors",
                            esAceptado ? "text-red-600 hover:bg-red-50" : cn("text-gray-300", COLORS.btnDisabled))}>
                        <Ban size={14} className={esAceptado ? "text-red-500" : "text-gray-300"} />
                        Anular
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Modal Detalle ────────────────────────────────────────────────────────────
interface ModalDetalleProps {
    comprobante: Comprobante;
    ruc: string;
    accessToken: string;
    onClose: () => void;
}

const ModalDetalle = ({ comprobante, ruc, accessToken, onClose }: ModalDetalleProps) => {
    const [tamanoPdf, setTamanoPdf] = useState('A4');
    const [showSizeMenu, setShowSizeMenu] = useState(false);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const sizeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (sizeRef.current && !sizeRef.current.contains(e.target as Node)) setShowSizeMenu(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const obtenerPdf = useCallback(async (tamano: string, abrir: boolean) => {
        setLoadingPdf(true);
        try {
            const ventana = abrir ? window.open('', '_blank') : null;
            if (ventana) {
                ventana.document.write(`
                    <html><head><title>Cargando PDF...</title></head>
                    <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#f8fafc;font-family:sans-serif;flex-direction:column;gap:16px;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
                        <p style="color:#64748b;font-size:14px;margin:0">Generando PDF, por favor espere...</p>
                    </body></html>
                `);
            }
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobante.comprobanteId}/pdf?tamano=${tamano}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            if (abrir && ventana) {
                ventana.location.href = url;
            } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = `${ruc}-${comprobante.serie}-${padCorrelativo(comprobante.correlativo)}.pdf`;
                a.click();
            }
        } catch { } finally { setLoadingPdf(false); }
    }, [comprobante, ruc, accessToken]);

    const colorEstado = COLORS.sunat[comprobante.estadoSunat as keyof typeof COLORS.sunat]?.badge ?? COLORS.sunat.PENDIENTE.badge;
    const iconoEstado = comprobante.estadoSunat === 'ACEPTADO' ? <CheckCircle2 size={15} /> : comprobante.estadoSunat === 'RECHAZADO' ? <X size={15} /> : <RefreshCw size={15} />;

    // ── Datos calculados ──
    const tieneDetraccion = comprobante.detracciones?.length > 0;
    const tieneCuotas = comprobante.cuotas?.length > 0;
    const tienePagos = comprobante.pagos?.length > 0;
    const tieneGuias = comprobante.guias?.length > 0;
    const tieneDetalles = comprobante.details?.length > 0;
    const tipoPagoLabel = TIPO_PAGO_MAP[comprobante.tipoPago] ?? comprobante.tipoPago;
    const porcentajeIgv = comprobante.details?.find(d => d.tipoAfectacionIGV === '10')?.porcentajeIGV ?? 18;
    const detallesFiltrados = comprobante.details?.filter(d => !esBolsaPlastica(d.descripcion)) ?? [];
    const detalleBolsa = comprobante.details?.filter(d => esBolsaPlastica(d.descripcion) && d.icbper > 0) ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col animate-in zoom-in-95 duration-200" style={{ maxHeight: '90vh' }}>

                {/* Header */}
                <div className="bg-blue-600 rounded-t-2xl px-6 pt-6 pb-5 flex items-start justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{comprobante.numeroCompleto}</h2>
                            <p className="text-blue-200 text-sm mt-0.5">{tipoLabel(comprobante.tipoComprobante)} · {formatFecha(comprobante.fechaEmision)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors mt-0.5">
                        <X size={17} className="text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

                    {/* Estado SUNAT */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold", colorEstado)}>
                            {iconoEstado} Estado SUNAT: {comprobante.estadoSunat === 'ACEPTADO' ? 'Aceptado' : comprobante.estadoSunat === 'RECHAZADO' ? 'Rechazado' : 'Pendiente'}
                        </div>
                        {comprobante.mensajeRespuestaSunat && (
                            <p className={cn("text-xs rounded-xl px-3 py-1.5", comprobante.estadoSunat === 'ACEPTADO' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
                                {limpiarMensajeSunat(comprobante.mensajeRespuestaSunat)}
                            </p>
                        )}
                    </div>

                    {/* Info básica */}
                    <div className="grid grid-cols-2 gap-3">
                        <DataCard icon={<Building2 size={14} className="text-gray-400" />} label="CLIENTE / RECEPTOR" value={comprobante.cliente.razonSocial} />
                        <DataCard icon={<Hash size={14} className="text-gray-400" />} label="RUC / DNI" value={comprobante.cliente.numeroDocumento} />
                        <DataCard icon={<Calendar size={14} className="text-gray-400" />} label="FECHA DE EMISIÓN" value={formatFecha(comprobante.fechaEmision)} />
                        <DataCard icon={<FileText size={14} className="text-gray-400" />} label="TIPO DE COMPROBANTE" value={tipoLabel(comprobante.tipoComprobante)} />
                        <DataCard icon={<Hash size={14} className="text-gray-400" />} label="SERIE" value={comprobante.serie} />
                        <DataCard icon={<Hash size={14} className="text-gray-400" />} label="CORRELATIVO" value={padCorrelativo(comprobante.correlativo)} />
                        {comprobante.tipDocAfectado && (
                            <DataCard icon={<FileText size={14} className="text-gray-400" />} label="DOC. AFECTADO" value={comprobante.numDocAfectado ?? '—'} />
                        )}
                        {comprobante.motivoNota && (
                            <DataCard icon={<AlertCircle size={14} className="text-gray-400" />} label="MOTIVO" value={comprobante.motivoNota} />
                        )}
                    </div>

                    {/* ── Detalle de productos ── */}
                    {tieneDetalles && (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Detalle de productos</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50/80 border-b border-gray-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-gray-400 font-semibold w-20">Código</th>
                                            <th className="px-3 py-2 text-left text-gray-400 font-semibold">Producto</th>
                                            <th className="px-3 py-2 text-right text-gray-400 font-semibold w-24">Valor Venta</th>
                                            <th className="px-3 py-2 text-right text-gray-400 font-semibold w-24">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {detallesFiltrados.map((d, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50">
                                                <td className="px-3 py-2.5 text-gray-500 align-top">{d.codigo}</td>
                                                <td className="px-3 py-2.5 align-top">
                                                    <p className="font-medium text-gray-800 max-w-50 leading-tight wrap-break-word">{d.descripcion}</p>
                                                    <p className="text-gray-400 mt-0.5">{d.cantidad} × S/ {d.precioVenta.toFixed(2)}</p>
                                                    {d.descuentoTotal > 0 && (
                                                        <p className="text-gray-400">{d.cantidad} × S/ {d.descuentoUnitario.toFixed(2)} desc.</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-gray-700 align-top font-mono">
                                                    S/ {d.valorVenta.toFixed(2)}
                                                    {d.descuentoTotal > 0 && (
                                                        <p className="text-red-400">- S/ {d.descuentoTotal.toFixed(2)}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-gray-800 align-top font-mono">
                                                    S/ {d.totalVentaItem.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Bolsa ICBPER */}
                                        {detalleBolsa.map((d, i) => (
                                            <tr key={`bolsa-${i}`} className="bg-amber-50/40">
                                                <td className="px-3 py-2.5 text-gray-500 align-top">{d.codigo}</td>
                                                <td className="px-3 py-2.5 align-top">
                                                    <p className="font-medium text-amber-700 max-w-50 leading-tight wrap-break-word">{d.descripcion}</p>
                                                    <p className="text-gray-400 mt-0.5">{d.cantidad} × S/ {d.precioVenta.toFixed(2)}</p>
                                                    <p className="text-amber-600 mt-0.5">Aplica ICBPER · {d.cantidad} × {d.factorIcbper} = S/ {d.icbper.toFixed(2)}</p>
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-gray-700 align-top font-mono">S/ {d.valorVenta.toFixed(2)}</td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-amber-700 align-top font-mono">S/ {d.totalVentaItem.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Totales ── */}
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Resumen de importes</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {comprobante.totalOperacionesGravadas > 0 && (
                                <div className="px-4 py-2.5 flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Op. Gravadas</span>
                                    <span className="text-sm text-gray-900 font-medium">S/ {comprobante.totalOperacionesGravadas.toFixed(2)}</span>
                                </div>
                            )}
                            {comprobante.totalOperacionesExoneradas > 0 && (
                                <div className="px-4 py-2.5 flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Op. Exoneradas</span>
                                    <span className="text-sm text-gray-900 font-medium">S/ {comprobante.totalOperacionesExoneradas.toFixed(2)}</span>
                                </div>
                            )}
                            {comprobante.totalOperacionesInafectas > 0 && (
                                <div className="px-4 py-2.5 flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Op. Inafectas</span>
                                    <span className="text-sm text-gray-900 font-medium">S/ {comprobante.totalOperacionesInafectas.toFixed(2)}</span>
                                </div>
                            )}
                            {comprobante.totalIGV > 0 && (
                                <div className="px-4 py-2.5 flex justify-between items-center">
                                    <span className="text-sm text-gray-600">IGV ({porcentajeIgv}%)</span>
                                    <span className="text-sm text-gray-900 font-medium">S/ {comprobante.totalIGV.toFixed(2)}</span>
                                </div>
                            )}
                            {comprobante.totalIcbper > 0 && (
                                <div className="px-4 py-2.5 flex justify-between items-center">
                                    <span className="text-sm text-gray-600">ICBPER</span>
                                    <span className="text-sm text-amber-600 font-medium">S/ {comprobante.totalIcbper.toFixed(2)}</span>
                                </div>
                            )}
                            {comprobante.descuentoGlobal > 0 && (
                                <div className="px-4 py-2.5 flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Descuento Global</span>
                                    <span className="text-sm text-red-600 font-medium">- S/ {comprobante.descuentoGlobal.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="px-4 py-3 flex justify-between items-center bg-blue-50/60">
                                <span className="text-sm font-bold text-gray-900">TOTAL</span>
                                <span className="text-sm font-bold text-blue-700">S/ {comprobante.importeTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Leyendas ── */}
                    {comprobante.legends?.length > 0 && (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Leyendas</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {comprobante.legends.map((l, i) => (
                                    <div key={i} className="px-4 py-2.5">
                                        <p className="text-xs text-gray-700 italic">{l.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Pagos y Cuotas ── */}
                    {(tienePagos || tieneCuotas) && (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Pagos</p>
                                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border",
                                    tieneCuotas ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                                    {tipoPagoLabel}
                                </span>
                            </div>
                            <div className={cn("grid divide-gray-100", tieneCuotas ? "grid-cols-2 divide-x" : "grid-cols-1")}>
                                {/* Medios de pago */}
                                {tienePagos && (
                                    <div className="divide-y divide-gray-100">
                                        <div className="px-4 py-2 bg-gray-50/50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Medios de pago</p>
                                        </div>
                                        {comprobante.pagos.map((p, i) => (
                                            <div key={i} className="px-4 py-2.5 flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-800">{p.medioPago}</p>
                                                    {p.entidadFinanciera && <p className="text-[10px] text-gray-400">{p.entidadFinanciera}</p>}
                                                    {p.observaciones && <p className="text-[10px] text-gray-400">{p.observaciones}</p>}
                                                </div>
                                                <span className="text-xs font-semibold text-gray-800 font-mono">S/ {p.monto.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Cuotas */}
                                {tieneCuotas && (
                                    <div className="divide-y divide-gray-100">
                                        <div className="px-4 py-2 bg-gray-50/50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cuotas</p>
                                        </div>
                                        {comprobante.cuotas.map((c, i) => (
                                            <div key={i} className="px-4 py-2.5 flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-800">{c.numeroCuota}</p>
                                                    <p className="text-[10px] text-gray-400">Vence: {formatFecha(c.fechaVencimiento)}</p>
                                                </div>
                                                <span className="text-xs font-semibold text-gray-800 font-mono">S/ {c.monto.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Detracción y Guías en 2 columnas ── */}
                    {(tieneDetraccion || tieneGuias) && (
                        <div className={cn("grid gap-4", tieneDetraccion && tieneGuias ? "grid-cols-2" : "grid-cols-1")}>
                            {/* Detracción */}
                            {tieneDetraccion && (
                                <div className="border border-amber-100 rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Detracción</p>
                                    </div>
                                    {comprobante.detracciones.map((d, i) => (
                                        <div key={i} className="px-4 py-3 space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Cuenta</span>
                                                <span className="font-medium text-gray-800">{d.cuentaBancoDetraccion}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Porcentaje</span>
                                                <span className="font-medium text-gray-800">{d.porcentajeDetraccion}%</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Monto</span>
                                                <span className="font-semibold text-amber-700">S/ {d.montoDetraccion.toFixed(2)}</span>
                                            </div>
                                            {d.observacion && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Obs.</span>
                                                    <span className="text-gray-600">{d.observacion}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Guías */}
                            {tieneGuias && (
                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Guías de Remisión</p>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {comprobante.guias.map((g: any, i: number) => (
                                            <div key={i} className="px-4 py-2.5">
                                                <p className="text-xs font-medium text-gray-800">{g.guiaNumeroCompleto}</p>
                                                <p className="text-[10px] text-gray-400">{TIPO_GUIA_MAP[g.guiaTipoDoc] ?? g.guiaTipoDoc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-3 flex gap-2 border-t border-gray-100 shrink-0">
                    <button onClick={() => obtenerPdf('A4', true)} disabled={loadingPdf}
                        className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors", COLORS.btnPrimary, loadingPdf && COLORS.btnDisabled)}>
                        {loadingPdf ? <RefreshCw size={15} className="animate-spin" /> : <Eye size={15} />} Ver PDF
                    </button>
                    <div className="relative flex-1" ref={sizeRef}>
                        <button onClick={() => setShowSizeMenu(o => !o)}
                            className={cn("w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors", COLORS.btnSecondary)}>
                            <Download size={15} /> Descargar <ChevronDown size={12} className={cn("transition-transform", showSizeMenu && "rotate-180")} />
                        </button>
                        {showSizeMenu && (
                            <div className="absolute bottom-full mb-1.5 left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                {PDF_SIZES.map(size => (
                                    <button key={size} onClick={() => { obtenerPdf(size, false); setShowSizeMenu(false); }}
                                        className="w-full px-3.5 py-2 text-xs text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                                        {size}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose}
                        className={cn("flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors whitespace-nowrap", COLORS.btnSecondary)}>
                        <X size={15} /> Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Modal Envío ──────────────────────────────────────────────────────────────
interface ModalEnvioProps {
    comprobante: Comprobante;
    tipo: 'email' | 'whatsapp';
    ruc: string;
    accessToken: string;
    onClose: () => void;
    onEnviado: (tipo: 'email' | 'whatsapp') => void;
}

const ModalEnvio = ({ comprobante, tipo, ruc, accessToken, onClose, onEnviado }: ModalEnvioProps) => {
    const esEmail = tipo === 'email';
    const yaEnviado = esEmail ? comprobante.cliente.enviadoPorCorreo : comprobante.cliente.enviadoPorWhatsApp;
    const [destino, setDestino] = useState(esEmail ? (comprobante.cliente.correo ?? '') : (comprobante.cliente.whatsApp ?? ''));
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState(false);

    const serieNum = `${comprobante.serie}-${padCorrelativo(comprobante.correlativo)}`;

    const handleEnviar = async () => {
        if (!destino.trim()) return;
        setEnviando(true);
        try {
            // Obtener PDF
            const resPdf = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobante.comprobanteId}/pdf?tamano=A4`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!resPdf.ok) throw new Error('No se pudo obtener el PDF');
            const pdfBlob = await resPdf.blob();
            const pdfFile = new File([pdfBlob], `${ruc}-${tipoLabel(comprobante.tipoComprobante)}-${serieNum}.pdf`, { type: 'application/pdf' });

            if (esEmail) {
                const formData = new FormData();
                formData.append('toEmail', destino);
                formData.append('toName', comprobante.cliente.razonSocial);
                formData.append('subject', `${tipoLabel(comprobante.tipoComprobante)} Electrónica ${serieNum}`);
                formData.append('body', `Adjuntamos su ${tipoLabel(comprobante.tipoComprobante)} electrónica.`);
                formData.append('tipo', comprobante.tipoComprobante === '03' ? '3' : '1');
                formData.append('comprobanteJson', JSON.stringify({
                    serieNumero: serieNum,
                    estadoSunat: comprobante.estadoSunat,
                    items: (comprobante.details ?? []).map(d => ({ 
                        descripcion: d.descripcion, 
                        cantidad: d.cantidad, 
                        precioUnitario: d.precioVenta 
                    })),
                    igv: comprobante.totalIGV,
                    total: comprobante.importeTotal,
                }));
                formData.append('adjunto', pdfFile);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email/send`, {
                    method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: formData,
                });
                if (!res.ok) throw new Error('Error al enviar correo');
            } else {
                const whatsappApiKey = process.env.NEXT_PUBLIC_WHATSAPP_API_KEY!;
                const whatsappBase = 'https://do.velsat.pe:8443/whatsapp';
                const uploadForm = new FormData();
                uploadForm.append('file', pdfFile);
                const resUpload = await fetch(`${whatsappBase}/api/upload`, {
                    method: 'POST', headers: { 'x-api-key': whatsappApiKey }, body: uploadForm,
                });
                if (!resUpload.ok) throw new Error('No se pudo subir el PDF');
                const fileUrl = (await resUpload.json()).datos.url;
                const numeroFormateado = destino.startsWith('51') ? destino : `51${destino}`;
                const resWsp = await fetch(`${whatsappBase}/api/send/single`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': whatsappApiKey },
                    body: JSON.stringify({
                        phone: numeroFormateado, type: 'documento', file_url: fileUrl,
                        filename: pdfFile.name, mime_type: 'application/pdf',
                        text: `Estimado(a) ${comprobante.cliente.razonSocial}, adjuntamos su ${tipoLabel(comprobante.tipoComprobante)} electrónica ${serieNum}.`,
                    }),
                });
                if (!resWsp.ok) throw new Error('Error al enviar por WhatsApp');
            }
            setExito(true);
            onEnviado(tipo);
            setTimeout(() => { setExito(false); onClose(); }, 1500);
        } catch { } finally { setEnviando(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={cn("px-6 py-4 flex items-center justify-between", esEmail ? "bg-blue-50 border-b border-blue-100" : "bg-green-50 border-b border-green-100")}>
                    <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", esEmail ? "bg-blue-100" : "bg-green-100")}>
                            {esEmail ? <Mail size={18} className="text-blue-600" /> : <MessageCircle size={18} className="text-green-600" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Enviar por {esEmail ? 'Correo electrónico' : 'WhatsApp'}</h2>
                            <p className="text-xs text-gray-500">{tipoLabel(comprobante.tipoComprobante)}: {comprobante.numeroCompleto}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/70 rounded-lg transition-colors">
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {yaEnviado && (
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <CheckCircle2 size={15} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">
                                Este comprobante ya fue enviado el <span className="font-semibold">{formatFechaHora(comprobante.fechaCreacion)}</span>. Puedes volver a enviarlo.
                            </p>
                        </div>
                    )}
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="text-sm font-semibold text-gray-900">{comprobante.cliente.razonSocial}</p>
                        <p className="text-xs text-gray-500">{comprobante.cliente.numeroDocumento}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                            {esEmail ? 'Correo electrónico' : 'Número de WhatsApp'}
                        </label>
                        <input type={esEmail ? 'email' : 'tel'} value={destino} onChange={e => setDestino(e.target.value)}
                            placeholder={esEmail ? 'correo@ejemplo.com' : '51987654321'}
                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" />
                        {!esEmail && <p className="text-xs text-gray-400 mt-1">Incluye el código de país. Ej: 51987654321</p>}
                    </div>
                </div>
                <div className="px-6 pb-5 flex gap-3">
                    <button onClick={onClose} className={cn("flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors", COLORS.btnSecondary)}>Cancelar</button>
                    <button onClick={handleEnviar} disabled={enviando || exito || !destino.trim()}
                        className={cn("flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all",
                            exito ? "bg-emerald-500 text-white"
                                : esEmail ? cn(COLORS.btnPrimary, "disabled:opacity-50")
                                    : cn(COLORS.btnGreen, "disabled:opacity-50"))}>
                        {exito ? <><CheckCircle2 size={16} /> Enviado</>
                            : enviando ? <><RefreshCw size={16} className="animate-spin" /> Enviando...</>
                                : <><Send size={16} /> Enviar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Constantes filtros ───────────────────────────────────────────────────────
const TIPOS_OPTS = ['Todos', 'Factura', 'Boleta', 'Nota de Crédito', 'Nota de Débito'];
const ESTADOS_OPTS = ['Todos', 'Aceptado', 'Pendiente', 'Rechazado'];
const ESTADO_COLORS_MAP: Record<string, string> = { Aceptado: 'bg-emerald-500', Pendiente: 'bg-amber-400', Rechazado: 'bg-red-500' };

// ─── Page Principal ───────────────────────────────────────────────────────────
export default function VerComprobantesPage() {
    const { accessToken, user } = useAuth();
    const isSuperAdmin = user?.rol === 'superadmin';
    const rucEmpresa: string = user?.ruc ?? '';
    const sucursalId: number = Number(user?.sucursalID ?? 0);

    // ── Hooks de datos ──
    const hookEmpresa = useComprobantesEmpresa();
    const hookSucursal = useComprobantesSucursal();
    const hookUnico = useComprobanteUnico();
    const hookCliente = useComprobantesEmpresaCliente();
    const hookUsuario = useComprobantesEmpresaUsuario();
    const { sucursales, loadingSucursales } = useSucursalRuc(isSuperAdmin);

    // ── Estado local ──
    const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
    const [search, setSearch] = useState('');
    const [resultsPerPage, setResultsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [modalEnvio, setModalEnvio] = useState<{ comprobante: Comprobante; tipo: 'email' | 'whatsapp' } | null>(null);
    const [detalle, setDetalle] = useState<Comprobante | null>(null);

    // ── Filtros cabecera ──
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [showAvanzado, setShowAvanzado] = useState(false);
    const [sucursalFiltro, setSucursalFiltro] = useState<number | null>(null);

    // Opciones avanzadas
    const [modoAvanzado, setModoAvanzado] = useState<'unico' | 'cliente' | 'usuario'>('unico');
    const [avSerie, setAvSerie] = useState('');
    const [avNumero, setAvNumero] = useState('');
    const [avClienteDoc, setAvClienteDoc] = useState('');
    const [avUsuarioId, setAvUsuarioId] = useState('');
    const [avFechaDesde, setAvFechaDesde] = useState('');
    const [avFechaHasta, setAvFechaHasta] = useState('');

    // ── Loading del hook activo ──
    const loading = isSuperAdmin
        ? (sucursalFiltro ? hookSucursal.loading : hookEmpresa.loading)
        : hookSucursal.loading;

    // ── Carga inicial ──
    const cargarComprobantes = useCallback(async () => {
        if (isSuperAdmin && sucursalFiltro) {
            await hookSucursal.fetchComprobantes({
                sucursalId: sucursalFiltro,
                fechaDesde: fechaDesde || null,
                fechaHasta: fechaHasta || null,
            });
        } else if (isSuperAdmin) {
            await hookEmpresa.fetchComprobantes({
                ruc: rucEmpresa,
                fechaDesde: fechaDesde || null,
                fechaHasta: fechaHasta || null,
            });
        } else {
            await hookSucursal.fetchComprobantes({
                sucursalId,
                fechaDesde: fechaDesde || null,
                fechaHasta: fechaHasta || null,
            });
        }
    }, [isSuperAdmin, sucursalFiltro, rucEmpresa, sucursalId, fechaDesde, fechaHasta]);

    useEffect(() => {
        if (!user || !accessToken) return 
        cargarComprobantes()
    }, [cargarComprobantes, user, accessToken])

    // Sincronizar resultados al hook activo
    useEffect(() => {
        if (isSuperAdmin && sucursalFiltro) setComprobantes(hookSucursal.comprobantes);
        else if (isSuperAdmin) setComprobantes(hookEmpresa.comprobantes);
        else setComprobantes(hookSucursal.comprobantes);
    }, [hookEmpresa.comprobantes, hookSucursal.comprobantes, isSuperAdmin, sucursalFiltro]);

    // Sincronizar resultado único / cliente / usuario
    useEffect(() => { if (hookUnico.comprobante) setComprobantes([hookUnico.comprobante]); }, [hookUnico.comprobante]);
    useEffect(() => { if (hookCliente.comprobantes.length) setComprobantes(hookCliente.comprobantes); }, [hookCliente.comprobantes]);
    useEffect(() => { if (hookUsuario.comprobantes.length) setComprobantes(hookUsuario.comprobantes); }, [hookUsuario.comprobantes]);

    // ── Buscar avanzado ──
    const buscarAvanzado = async () => {
        if (modoAvanzado === 'unico' && avSerie && avNumero) {
            await hookUnico.fetchComprobante({ ruc: rucEmpresa, serie: avSerie, numero: Number(avNumero) });
        } else if (modoAvanzado === 'cliente' && avClienteDoc) {
            await hookCliente.fetchComprobantes({ rucEmpresa, clienteNumDoc: avClienteDoc, fechaDesde: avFechaDesde || null, fechaHasta: avFechaHasta || null });
        } else if (modoAvanzado === 'usuario' && avUsuarioId) {
            await hookUsuario.fetchComprobantes({ rucEmpresa, usuarioId: Number(avUsuarioId), fechaDesde: avFechaDesde || null, fechaHasta: avFechaHasta || null });
        }
    };

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
    const totalPages = Math.max(1, Math.ceil(filtered.length / resultsPerPage));
    const paginated = filtered.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);
    useEffect(() => { setCurrentPage(1); }, [search, filtroTipo, filtroEstado, comprobantes]);

    // ── Reenviar SUNAT ──
    const reenviarSunat = async (c: Comprobante) => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${c.comprobanteId}/enviar-sunat`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (res.data.exitoso) await cargarComprobantes();
        } catch { }
    };

    // ── Anular (vacío por ahora) ──
    const anularComprobante = async (_c: Comprobante) => {
        // TODO: implementar cuando esté el endpoint
    };

    // ── Agregar a resumen (vacío) ──
    const agregarResumen = async (_c: Comprobante) => {
        // TODO: implementar cuando esté el endpoint
    };

    return (
        <div className="space-y-0 animate-in fade-in duration-500">

            {/* Modales */}
            {detalle && (
                <ModalDetalle
                    comprobante={detalle}
                    ruc={rucEmpresa}
                    accessToken={accessToken ?? ''}
                    onClose={() => setDetalle(null)}
                />
            )}
            {modalEnvio && (
                <ModalEnvio
                    comprobante={modalEnvio.comprobante}
                    tipo={modalEnvio.tipo}
                    ruc={rucEmpresa}
                    accessToken={accessToken ?? ''}
                    onClose={() => setModalEnvio(null)}
                    onEnviado={() => cargarComprobantes()}
                />
            )}

            <div className="border border-gray-200 border-dashed bg-white shadow-sm rounded-xl overflow-hidden">

                {/* ── Cabecera con filtros ── */}
                <div className="p-4 space-y-3 border-b border-gray-100">

                    {/* Fila 1: fechas + sucursal (superadmin) + buscar */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Desde</label>
                            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 shadow-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Hasta</label>
                            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 shadow-sm" />
                        </div>

                        {/* Selector sucursal solo superadmin */}
                        {isSuperAdmin && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                    Sucursal {loadingSucursales && <RefreshCw size={10} className="animate-spin text-blue-400" />}
                                </label>
                                <select value={sucursalFiltro ?? ''}
                                    onChange={e => setSucursalFiltro(e.target.value ? Number(e.target.value) : null)}
                                    className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 shadow-sm min-w-40">
                                    <option value="">Todas las sucursales</option>
                                    {sucursales.map((s: any) => (
                                        <option key={s.sucursalId} value={s.sucursalId}>{s.nombre ?? s.codEstablecimiento}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button onClick={cargarComprobantes} disabled={loading}
                            className={cn("flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm", COLORS.btnPrimary, loading && COLORS.btnDisabled)}>
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                            Buscar
                        </button>

                        <button onClick={() => setShowAvanzado(o => !o)}
                            className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-all shadow-sm",
                                showAvanzado ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")}>
                            <Filter size={14} /> Opciones avanzadas
                            <ChevronDown size={13} className={cn("transition-transform", showAvanzado && "rotate-180")} />
                        </button>
                    </div>

                    {/* Opciones avanzadas */}
                    {showAvanzado && (
                        <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            {/* Tabs modo */}
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
                                {([
                                    { key: 'unico', label: 'Comprobante único' },
                                    { key: 'cliente', label: 'Por cliente' },
                                    { key: 'usuario', label: 'Por usuario' },
                                ] as const).map(tab => (
                                    <button key={tab.key} onClick={() => setModoAvanzado(tab.key)}
                                        className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                            modoAvanzado === tab.key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100")}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Campos según modo */}
                            <div className="flex flex-wrap items-end gap-3">
                                {modoAvanzado === 'unico' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Serie</label>
                                            <input value={avSerie} onChange={e => setAvSerie(e.target.value)}
                                                placeholder="F001"
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-28" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Número</label>
                                            <input type="number" value={avNumero} onChange={e => setAvNumero(e.target.value)}
                                                placeholder="135"
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-28" />
                                        </div>
                                    </>
                                )}
                                {modoAvanzado === 'cliente' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nº Doc. Cliente</label>
                                            <input value={avClienteDoc} onChange={e => setAvClienteDoc(e.target.value)}
                                                placeholder="20601234567"
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-36" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Desde</label>
                                            <input type="date" value={avFechaDesde} onChange={e => setAvFechaDesde(e.target.value)}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Hasta</label>
                                            <input type="date" value={avFechaHasta} onChange={e => setAvFechaHasta(e.target.value)}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                    </>
                                )}
                                {modoAvanzado === 'usuario' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">ID Usuario</label>
                                            <input type="number" value={avUsuarioId} onChange={e => setAvUsuarioId(e.target.value)}
                                                placeholder="1"
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-28" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Desde</label>
                                            <input type="date" value={avFechaDesde} onChange={e => setAvFechaDesde(e.target.value)}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Hasta</label>
                                            <input type="date" value={avFechaHasta} onChange={e => setAvFechaHasta(e.target.value)}
                                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                    </>
                                )}

                                <button onClick={buscarAvanzado} disabled={loading}
                                    className={cn("flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors", COLORS.btnPrimary, loading && COLORS.btnDisabled)}>
                                    <Search size={14} /> Buscar
                                </button>

                                <button onClick={() => {
                                    setAvSerie(''); setAvNumero(''); setAvClienteDoc(''); setAvUsuarioId('');
                                    setAvFechaDesde(''); setAvFechaHasta('');
                                    cargarComprobantes();
                                }} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                                    <X size={12} /> Limpiar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Fila 2: búsqueda + filtros dropdown + paginación */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap flex-1">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-52 pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm text-sm" />
                            </div>
                            <div className="h-7 w-px bg-gray-200 hidden md:block" />
                            <DropdownFiltro label="Tipo de comprobante" value={filtroTipo} options={TIPOS_OPTS} onChange={v => { setFiltroTipo(v); setCurrentPage(1); }} />
                            <DropdownFiltro label="Estado SUNAT" value={filtroEstado} options={ESTADOS_OPTS} onChange={v => { setFiltroEstado(v); setCurrentPage(1); }} colorMap={ESTADO_COLORS_MAP} />
                            {(filtroTipo !== 'Todos' || filtroEstado !== 'Todos') && (
                                <button onClick={() => { setFiltroTipo('Todos'); setFiltroEstado('Todos'); }}
                                    className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors">
                                    Limpiar
                                </button>
                            )}
                        </div>
                        <div className="relative shrink-0">
                            <select value={resultsPerPage} onChange={e => { setResultsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium border border-gray-200 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 outline-none">
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* ── Tabla ── */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-t border-b border-gray-100/60 bg-white">
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">FECHA</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">COMPROBANTE</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">CLIENTE</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">PDF</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">XML</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">CDR</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">SUNAT</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">CORREO</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">WHATSAPP</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">VER</th>
                                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">OPCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/60">
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
                                <tr key={doc.comprobanteId} className="hover:bg-gray-50/50 transition-colors bg-white">
                                    <td className="px-5 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                                        {formatFecha(doc.fechaCreacion)}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-800 whitespace-nowrap">
                                        {tipoLabel(doc.tipoComprobante)}: {doc.numeroCompleto}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{doc.cliente.numeroDocumento}</span>
                                            <span className="text-sm text-gray-600">{doc.cliente.razonSocial}</span>
                                        </div>
                                    </td>

                                    {/* PDF */}
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <StatusIcon type="pdf" status="available" onClick={() => setDetalle(doc)} />
                                        </div>
                                    </td>

                                    {/* XML */}
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <StatusIcon type="xml" status="available" />
                                        </div>
                                    </td>

                                    {/* CDR */}
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <StatusIcon type="cdr" status="available" />
                                        </div>
                                    </td>

                                    {/* SUNAT */}
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <BadgeSunat estado={doc.estadoSunat} />
                                        </div>
                                    </td>

                                    {/* Correo */}
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <BtnEnvio
                                                tipo="email"
                                                enviado={doc.cliente.enviadoPorCorreo}
                                                fecha={formatFechaHora(doc.fechaCreacion)}
                                                onClick={() => setModalEnvio({ comprobante: doc, tipo: 'email' })}
                                            />
                                        </div>
                                    </td>

                                    {/* WhatsApp */}
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <BtnEnvio
                                                tipo="whatsapp"
                                                enviado={doc.cliente.enviadoPorWhatsApp}
                                                fecha={formatFechaHora(doc.fechaCreacion)}
                                                onClick={() => setModalEnvio({ comprobante: doc, tipo: 'whatsapp' })}
                                            />
                                        </div>
                                    </td>

                                    {/* Ver */}
                                    <td className="px-5 py-4 text-center">
                                        <button onClick={() => setDetalle(doc)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                            <Eye size={13} /> Ver
                                        </button>
                                    </td>

                                    {/* Opciones */}
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <DropdownOpciones
                                                comprobante={doc}
                                                onReenviar={() => reenviarSunat(doc)}
                                                onResumen={() => agregarResumen(doc)}
                                                onAnular={() => anularComprobante(doc)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Pie: paginación ── */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white flex-wrap gap-3">
                    <p className="text-sm text-gray-500">
                        Mostrando <span className="font-semibold text-gray-700">{Math.min((currentPage - 1) * resultsPerPage + 1, filtered.length)}</span>–<span className="font-semibold text-gray-700">{Math.min(currentPage * resultsPerPage, filtered.length)}</span> de <span className="font-semibold text-gray-700">{filtered.length}</span> resultados
                    </p>

                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                            className={cn("p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors", currentPage === 1 && COLORS.btnDisabled)}>
                            <ChevronsLeft size={14} className="text-gray-600" />
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className={cn("p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors", currentPage === 1 && COLORS.btnDisabled)}>
                            <ChevronLeft size={14} className="text-gray-600" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium text-gray-700">{currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                            className={cn("p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors", currentPage === totalPages && COLORS.btnDisabled)}>
                            <ChevronRight size={14} className="text-gray-600" />
                        </button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                            className={cn("p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors", currentPage === totalPages && COLORS.btnDisabled)}>
                            <ChevronsRight size={14} className="text-gray-600" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle2 size={9} className="text-white" strokeWidth={2.5} />
                        </span>
                        Ya enviado (puede reenviar)
                    </div>
                </div>
            </div>
        </div>
    );
}
