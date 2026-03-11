"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    ChevronDown, RefreshCw, Mail, MessageCircle, CheckCircle2, X, Send,
    Eye, FileText, Calendar, Hash, Building2, Download, Check
} from 'lucide-react';
import { cn } from '@/app/utils/cn';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EnvioEstado {
    enviado: boolean;
    fecha?: string;
}

type TipoComprobante = 'Factura' | 'Boleta' | 'Nota de Crédito' | 'Nota de Débito' | 'Guía de Remisión';
type EstadoSunat = 'Aceptado' | 'Pendiente' | 'Rechazado';

interface Comprobante {
    id: number;
    fecha: string;
    comprobanteId: string;
    serie: string;
    correlativo: string;
    tipo: TipoComprobante;
    clienteRuc: string;
    clienteNombre: string;
    clienteEmail?: string;
    clienteTelefono?: string;
    subtotal: number;
    igv: number;
    total: number;
    estadoSunat: EstadoSunat;
    pdfStatus: 'available' | 'pending';
    xmlStatus: 'available' | 'pending';
    cdrStatus: 'available' | 'pending';
    envioEmail: EnvioEstado;
    envioWhatsapp: EnvioEstado;
}

// ─── Data inicial ────────────────────────────────────────────────────────────

const INITIAL_COMPROBANTES: Comprobante[] = [
    {
        id: 1, fecha: '16/06/2023', comprobanteId: 'Factura: F001-00001',
        serie: 'F001', correlativo: '00001', tipo: 'Factura',
        clienteRuc: '10000000001', clienteNombre: 'Victor Arana',
        clienteEmail: 'victor.arana@email.com', clienteTelefono: '51987654321',
        subtotal: 1000.00, igv: 180.00, total: 1180.00, estadoSunat: 'Aceptado',
        pdfStatus: 'available', xmlStatus: 'available', cdrStatus: 'available',
        envioEmail: { enviado: true, fecha: '16/06/2023 10:30' }, envioWhatsapp: { enviado: false },
    },
    {
        id: 2, fecha: '15/06/2023', comprobanteId: 'Factura: F001-00002',
        serie: 'F001', correlativo: '00002', tipo: 'Factura',
        clienteRuc: '20601234567', clienteNombre: 'Corporación Aceros SAC',
        clienteEmail: 'contabilidad@aceros.com', clienteTelefono: '51912345678',
        subtotal: 2500.00, igv: 450.00, total: 2950.00, estadoSunat: 'Pendiente',
        pdfStatus: 'available', xmlStatus: 'pending', cdrStatus: 'pending',
        envioEmail: { enviado: false }, envioWhatsapp: { enviado: true, fecha: '15/06/2023 14:00' },
    },
    {
        id: 3, fecha: '14/06/2023', comprobanteId: 'Boleta: B001-00001',
        serie: 'B001', correlativo: '00001', tipo: 'Boleta',
        clienteRuc: '10456789012', clienteNombre: 'Juan Pérez García',
        clienteEmail: 'juan.perez@gmail.com', clienteTelefono: '51998877665',
        subtotal: 500.00, igv: 90.00, total: 590.00, estadoSunat: 'Aceptado',
        pdfStatus: 'available', xmlStatus: 'available', cdrStatus: 'available',
        envioEmail: { enviado: false }, envioWhatsapp: { enviado: false },
    },
    {
        id: 4, fecha: '13/06/2023', comprobanteId: 'Nota de Crédito: FC01-00001',
        serie: 'FC01', correlativo: '00001', tipo: 'Nota de Crédito',
        clienteRuc: '20512345678', clienteNombre: 'Importaciones del Sur SAC',
        clienteEmail: 'admin@importaciones.com', clienteTelefono: '51911223344',
        subtotal: 300.00, igv: 54.00, total: 354.00, estadoSunat: 'Rechazado',
        pdfStatus: 'available', xmlStatus: 'available', cdrStatus: 'pending',
        envioEmail: { enviado: false }, envioWhatsapp: { enviado: false },
    },
    {
        id: 5, fecha: '12/06/2023', comprobanteId: 'Guía de Remisión: T001-00001',
        serie: 'T001', correlativo: '00001', tipo: 'Guía de Remisión',
        clienteRuc: '10789456123', clienteNombre: 'Carlos Mendoza',
        clienteEmail: 'carlos@gmail.com', clienteTelefono: '51955667788',
        subtotal: 0, igv: 0, total: 0, estadoSunat: 'Pendiente',
        pdfStatus: 'available', xmlStatus: 'pending', cdrStatus: 'pending',
        envioEmail: { enviado: false }, envioWhatsapp: { enviado: false },
    },
    {
        id: 6, fecha: '11/06/2023', comprobanteId: 'Nota de Débito: FD01-00001',
        serie: 'FD01', correlativo: '00001', tipo: 'Nota de Débito',
        clienteRuc: '20398765432', clienteNombre: 'Textiles Norteños EIRL',
        clienteEmail: 'info@textiles.com', clienteTelefono: '51944556677',
        subtotal: 150.00, igv: 27.00, total: 177.00, estadoSunat: 'Aceptado',
        pdfStatus: 'available', xmlStatus: 'available', cdrStatus: 'available',
        envioEmail: { enviado: true, fecha: '11/06/2023 09:00' }, envioWhatsapp: { enviado: true, fecha: '11/06/2023 09:05' },
    },
];

// ─── Dropdown Filtro ─────────────────────────────────────────────────────────

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
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
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
                    active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                )}
            >
                {active ? value : label}
                {active
                    ? <X size={13} className="text-white/80" onClick={e => { e.stopPropagation(); onChange('Todos'); }} />
                    : <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
                }
            </button>

            {open && (
                <div className="absolute top-full mt-1.5 left-0 z-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            className={cn(
                                "w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors text-left",
                                value === opt
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : "text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {colorMap && opt !== 'Todos' && (
                                    <span className={cn("w-2 h-2 rounded-full", colorMap[opt])} />
                                )}
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

// ─── Badge Estado SUNAT ──────────────────────────────────────────────────────

const BadgeSunat = ({ estado }: { estado: EstadoSunat }) => {
    const config = {
        Aceptado: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={11} /> },
        Pendiente: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <RefreshCw size={11} /> },
        Rechazado: { cls: 'bg-red-50 text-red-700 border-red-200', icon: <X size={11} /> },
    }[estado];
    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap", config.cls)}>
            {config.icon} {estado}
        </span>
    );
};

// ─── DataCard auxiliar ───────────────────────────────────────────────────────

const DataCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="bg-gray-50 rounded-xl px-3.5 py-3">
        <div className="flex items-center gap-1.5 mb-1.5">
            {icon}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{value}</p>
    </div>
);

// ─── Modal Detalle Comprobante ───────────────────────────────────────────────

const ModalDetalle = ({ comprobante, onClose }: { comprobante: Comprobante; onClose: () => void }) => {
    const colorEstado = {
        Aceptado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
        Rechazado: 'bg-red-50 text-red-700 border-red-200',
    }[comprobante.estadoSunat];
    const iconoEstado = {
        Aceptado: <CheckCircle2 size={15} />,
        Pendiente: <RefreshCw size={15} />,
        Rechazado: <X size={15} />,
    }[comprobante.estadoSunat];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col animate-in zoom-in-95 duration-200" style={{ maxHeight: '90vh' }}>

                {/* Header azul full */}
                <div className="bg-blue-600 rounded-t-2xl px-6 pt-6 pb-5 flex items-start justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                {comprobante.serie}-{comprobante.correlativo}
                            </h2>
                            <p className="text-blue-200 text-sm mt-0.5">
                                {comprobante.tipo} · {comprobante.fecha}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors mt-0.5">
                        <X size={17} className="text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold", colorEstado)}>
                        {iconoEstado} Estado SUNAT: {comprobante.estadoSunat}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <DataCard icon={<Building2 size={14} className="text-gray-400" />} label="CLIENTE / RECEPTOR" value={comprobante.clienteNombre} />
                        <DataCard icon={<Hash size={14} className="text-gray-400" />} label="RUC / DNI" value={comprobante.clienteRuc} />
                        <DataCard icon={<Calendar size={14} className="text-gray-400" />} label="FECHA DE EMISIÓN" value={comprobante.fecha} />
                        <DataCard icon={<FileText size={14} className="text-gray-400" />} label="TIPO DE COMPROBANTE" value={comprobante.tipo} />
                        <DataCard icon={<Hash size={14} className="text-gray-400" />} label="SERIE" value={comprobante.serie} />
                        <DataCard icon={<Hash size={14} className="text-gray-400" />} label="CORRELATIVO" value={comprobante.correlativo} />
                    </div>
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Resumen de importes</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-gray-600">Subtotal (sin IGV)</span>
                                <span className="text-sm text-gray-900 font-medium">S/ {comprobante.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-gray-600">IGV (18%)</span>
                                <span className="text-sm text-gray-900 font-medium">S/ {comprobante.igv.toFixed(2)}</span>
                            </div>
                            <div className="px-4 py-3 flex justify-between items-center bg-blue-50/60">
                                <span className="text-sm font-bold text-gray-900">TOTAL</span>
                                <span className="text-sm font-bold text-blue-700">S/ {comprobante.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-3 flex gap-2 border-t border-gray-100 shrink-0">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        <Eye size={15} /> Ver PDF
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                        <Download size={15} /> Descargar PDF
                    </button>
                    <button className="flex items-center justify-center gap-2 px-3.5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors whitespace-nowrap">
                        <Mail size={15} /> Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Modal de Envío ──────────────────────────────────────────────────────────

interface ModalEnvioProps {
    comprobante: Comprobante;
    tipo: 'email' | 'whatsapp';
    onClose: () => void;
    onEnviar: (id: number, tipo: 'email' | 'whatsapp', destino: string) => void;
}

const ModalEnvio = ({ comprobante, tipo, onClose, onEnviar }: ModalEnvioProps) => {
    const esEmail = tipo === 'email';
    const yaEnviado = esEmail ? comprobante.envioEmail.enviado : comprobante.envioWhatsapp.enviado;
    const fechaEnvio = esEmail ? comprobante.envioEmail.fecha : comprobante.envioWhatsapp.fecha;
    const [destino, setDestino] = useState(esEmail ? (comprobante.clienteEmail || '') : (comprobante.clienteTelefono || ''));
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState(false);

    const handleEnviar = async () => {
        if (!destino.trim()) return;
        setEnviando(true);
        await new Promise(r => setTimeout(r, 1200));
        setEnviando(false);
        setExito(true);
        onEnviar(comprobante.id, tipo, destino);
        setTimeout(() => { setExito(false); onClose(); }, 1500);
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
                            <p className="text-xs text-gray-500">{comprobante.comprobanteId}</p>
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
                                Este comprobante ya fue enviado el <span className="font-semibold">{fechaEnvio}</span>. Puedes volver a enviarlo.
                            </p>
                        </div>
                    )}
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="text-sm font-semibold text-gray-900">{comprobante.clienteNombre}</p>
                        <p className="text-xs text-gray-500">{comprobante.clienteRuc}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                            {esEmail ? 'Correo electrónico' : 'Número de WhatsApp'}
                        </label>
                        <input
                            type={esEmail ? 'email' : 'tel'}
                            value={destino}
                            onChange={e => setDestino(e.target.value)}
                            placeholder={esEmail ? 'correo@ejemplo.com' : '51987654321'}
                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        />
                        {!esEmail && <p className="text-xs text-gray-400 mt-1">Incluye el código de país. Ej: 51987654321</p>}
                    </div>
                </div>
                <div className="px-6 pb-5 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleEnviar}
                        disabled={enviando || exito || !destino.trim()}
                        className={cn(
                            "flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all",
                            exito ? "bg-emerald-500 text-white"
                                : esEmail ? "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                                    : "bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                        )}
                    >
                        {exito ? <><CheckCircle2 size={16} /> Enviado</>
                            : enviando ? <><RefreshCw size={16} className="animate-spin" /> Enviando...</>
                                : <><Send size={16} /> Enviar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Botón de envío con estado ───────────────────────────────────────────────

const BtnEnvio = ({ tipo, enviado, fecha, onClick }: {
    tipo: 'email' | 'whatsapp'; enviado: boolean; fecha?: string; onClick: () => void;
}) => {
    const esEmail = tipo === 'email';
    return (
        <div className="flex flex-col items-center gap-1">
            <button
                onClick={onClick}
                title={enviado ? `Enviado el ${fecha}. Click para reenviar` : `Enviar por ${esEmail ? 'correo' : 'WhatsApp'}`}
                className={cn(
                    "relative p-2 rounded-xl transition-all",
                    enviado
                        ? esEmail ? "bg-blue-50 hover:bg-blue-100 text-blue-600" : "bg-green-50 hover:bg-green-100 text-green-600"
                        : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                )}
            >
                {esEmail ? <Mail size={17} /> : <MessageCircle size={17} />}
                {enviado && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" strokeWidth={2.5} />
                    </span>
                )}
            </button>
            {enviado && (
                <span className={cn("text-[10px] font-medium leading-none", esEmail ? "text-blue-500" : "text-green-500")}>
                    Enviado
                </span>
            )}
        </div>
    );
};

// ─── Status Icon ─────────────────────────────────────────────────────────────

const StatusIcon = ({ type, status }: { type: 'pdf' | 'xml' | 'cdr'; status: 'available' | 'pending' }) => {
    if (type === 'pdf') {
        return (
            <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Ver PDF">
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" className="w-5 h-5 opacity-90" alt="PDF" />
            </button>
        );
    }
    return (
        <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
            <RefreshCw size={18} className={cn("transition-colors", status === 'available' ? "text-emerald-500" : "text-gray-300")} />
        </button>
    );
};

// ─── Page Principal ───────────────────────────────────────────────────────────

const TIPOS: (TipoComprobante | 'Todos')[] = ['Todos', 'Factura', 'Boleta', 'Nota de Crédito', 'Nota de Débito', 'Guía de Remisión'];
const ESTADOS: (EstadoSunat | 'Todos')[] = ['Todos', 'Aceptado', 'Pendiente', 'Rechazado'];

const ESTADO_COLORS: Record<string, string> = {
    Aceptado: 'bg-emerald-500',
    Pendiente: 'bg-amber-400',
    Rechazado: 'bg-red-500',
};

export default function VerComprobantesPage() {
    const [comprobantes, setComprobantes] = useState<Comprobante[]>(INITIAL_COMPROBANTES);
    const [search, setSearch] = useState('');
    const [resultsPerPage, setResultsPerPage] = useState('10');
    const [modal, setModal] = useState<{ comprobante: Comprobante; tipo: 'email' | 'whatsapp' } | null>(null);
    const [detalle, setDetalle] = useState<Comprobante | null>(null);
    const [filtroTipo, setFiltroTipo] = useState<string>('Todos');
    const [filtroEstado, setFiltroEstado] = useState<string>('Todos');

    const filtered = useMemo(() => comprobantes.filter(c => {
        const matchSearch =
            c.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
            c.clienteRuc.includes(search) ||
            c.comprobanteId.toLowerCase().includes(search.toLowerCase());
        const matchTipo = filtroTipo === 'Todos' || c.tipo === filtroTipo;
        const matchEstado = filtroEstado === 'Todos' || c.estadoSunat === filtroEstado;
        return matchSearch && matchTipo && matchEstado;
    }), [comprobantes, search, filtroTipo, filtroEstado]);

    const handleEnviar = (id: number, tipo: 'email' | 'whatsapp', _destino: string) => {
        const now = new Date();
        const fecha = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
        setComprobantes(prev => prev.map(c => {
            if (c.id !== id) return c;
            if (tipo === 'email') return { ...c, envioEmail: { enviado: true, fecha } };
            return { ...c, envioWhatsapp: { enviado: true, fecha } };
        }));
    };

    return (
        <div className="space-y-0 animate-in fade-in duration-500">

            {/* Modales */}
            {detalle && <ModalDetalle comprobante={detalle} onClose={() => setDetalle(null)} />}
            {modal && (
                <ModalEnvio
                    comprobante={modal.comprobante}
                    tipo={modal.tipo}
                    onClose={() => setModal(null)}
                    onEnviar={handleEnviar}
                />
            )}


            <div className="border border-gray-200 border-dashed bg-white shadow-sm rounded-xl overflow-hidden">

                {/* Barra: búsqueda + filtros dropdown + paginación */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Izquierda: búsqueda + filtros */}
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="w-52 pl-3 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm text-sm"
                            />
                        </div>

                        {/* Separador visual */}
                        <div className="h-7 w-px bg-gray-200 hidden md:block" />

                        <DropdownFiltro
                            label="Tipo de comprobante"
                            value={filtroTipo}
                            options={TIPOS}
                            onChange={setFiltroTipo}
                        />
                        <DropdownFiltro
                            label="Estado SUNAT"
                            value={filtroEstado}
                            options={ESTADOS}
                            onChange={setFiltroEstado}
                            colorMap={ESTADO_COLORS}
                        />

                        {(filtroTipo !== 'Todos' || filtroEstado !== 'Todos') && (
                            <button
                                onClick={() => { setFiltroTipo('Todos'); setFiltroEstado('Todos'); }}
                                className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Derecha: paginación */}
                    <div className="relative shrink-0">
                        <select
                            value={resultsPerPage}
                            onChange={e => setResultsPerPage(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 text-sm font-medium border border-gray-200 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 outline-none"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* Tabla */}
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/60">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16 text-center text-sm text-gray-400">
                                        No se encontraron comprobantes con ese criterio.
                                    </td>
                                </tr>
                            ) : filtered.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors bg-white">
                                    <td className="px-5 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">{doc.fecha}</td>
                                    <td className="px-5 py-4 text-sm text-gray-800 whitespace-nowrap">{doc.comprobanteId}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{doc.clienteRuc}</span>
                                            <span className="text-sm text-gray-600">{doc.clienteNombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center"><div className="flex justify-center"><StatusIcon type="pdf" status={doc.pdfStatus} /></div></td>
                                    <td className="px-5 py-4 text-center"><div className="flex justify-center"><StatusIcon type="xml" status={doc.xmlStatus} /></div></td>
                                    <td className="px-5 py-4 text-center"><div className="flex justify-center"><StatusIcon type="cdr" status={doc.cdrStatus} /></div></td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <BadgeSunat estado={doc.estadoSunat} />
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <BtnEnvio tipo="email" enviado={doc.envioEmail.enviado} fecha={doc.envioEmail.fecha} onClick={() => setModal({ comprobante: doc, tipo: 'email' })} />
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center">
                                            <BtnEnvio tipo="whatsapp" enviado={doc.envioWhatsapp.enviado} fecha={doc.envioWhatsapp.fecha} onClick={() => setModal({ comprobante: doc, tipo: 'whatsapp' })} />
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => setDetalle(doc)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                        >
                                            <Eye size={13} /> Ver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pie */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
                    <p className="text-sm text-gray-500">
                        Mostrando <span className="font-semibold text-gray-700">{filtered.length}</span> de <span className="font-semibold text-gray-700">{comprobantes.length}</span> resultados
                    </p>
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