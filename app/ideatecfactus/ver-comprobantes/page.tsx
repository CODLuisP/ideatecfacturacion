"use client";
import React, { useState, useMemo } from 'react';
import {
    Search, FileText, ChevronDown, CheckCircle2, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { cn } from '@/app/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Comprobante {
    id: number;
    fecha: string;
    comprobanteId: string; // e.g., Factura: F001-1
    clienteRuc: string;
    clienteNombre: string;
    pdfStatus: 'available' | 'pending';
    xmlStatus: 'available' | 'pending';
    cdrStatus: 'available' | 'pending';
    sunatStatus: 'available' | 'pending';
}

// ─── Data inicial ──────────────────────────────────────────────────────────────

const INITIAL_COMPROBANTES: Comprobante[] = [
    {
        id: 1,
        fecha: '16/06/2023',
        comprobanteId: 'Factura: F001-1',
        clienteRuc: '10000000001',
        clienteNombre: 'Victor Arana',
        pdfStatus: 'available',
        xmlStatus: 'available',
        cdrStatus: 'available',
        sunatStatus: 'available'
    },
    {
        id: 2,
        fecha: '15/06/2023',
        comprobanteId: 'Factura: F001-2',
        clienteRuc: '20601234567',
        clienteNombre: 'Corporación Aceros SAC',
        pdfStatus: 'available',
        xmlStatus: 'pending',
        cdrStatus: 'pending',
        sunatStatus: 'pending'
    },
    {
        id: 3,
        fecha: '14/06/2023',
        comprobanteId: 'Boleta: B001-1',
        clienteRuc: '10456789012',
        clienteNombre: 'Juan Pérez García',
        pdfStatus: 'available',
        xmlStatus: 'available',
        cdrStatus: 'available',
        sunatStatus: 'available'
    },
];


// ─── Componentes Auxiliares ─────────────────────────────────────────────────────

const StatusIcon = ({ type, status }: { type: 'pdf' | 'xml' | 'cdr' | 'sunat', status: 'available' | 'pending' }) => {
    if (type === 'pdf') {
        return (
            <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Ver PDF">
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" className="w-5 h-5 opacity-90" alt="PDF" />
            </button>
        )
    }

    // XML, CDR, SUNAT icons (Refresh style arrow circle based on the user's mockup)
    return (
        <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
            <RefreshCw size={18} className={cn("transition-colors", status === 'available' ? "text-emerald-500" : "text-gray-300")} />
        </button>
    )
}


// ─── Page Principal ────────────────────────────────────────────────────────────

export default function VerComprobantesPage() {
    const [comprobantes, setComprobantes] = useState<Comprobante[]>(INITIAL_COMPROBANTES);
    const [search, setSearch] = useState('');
    const [resultsPerPage, setResultsPerPage] = useState('10');

    // ── Filtros ──
    const filtered = useMemo(() => comprobantes.filter(c => {
        const matchSearch = c.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
            c.clienteRuc.includes(search) || c.comprobanteId.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    }), [comprobantes, search]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ── Title ────────────────────────────────────────────────────────── */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">Lista de comprobantes</h3>
            </div>

            {/* ── Barra de búsqueda y filtros ──────────────────────────────────── */}
            <Card className="p-0 border border-gray-200 border-dashed bg-white shadow-sm rounded-xl overflow-hidden">
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-xs">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar"
                            className="w-full pl-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm text-sm"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap items-center">

                        <div className="relative">
                            <button
                                className="flex items-center gap-2 appearance-none pl-3 pr-8 py-2 text-sm font-medium border border-gray-200 bg-white rounded-lg outline-none cursor-pointer transition-all shadow-sm text-gray-700 hover:bg-gray-50"
                            >
                                Columnas
                            </button>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={resultsPerPage}
                                onChange={e => setResultsPerPage(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium border border-gray-200 bg-white rounded-lg outline-none cursor-pointer transition-all shadow-sm text-gray-700 hover:bg-gray-50"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>

                    </div>
                </div>

                {/* ── Tabla ─────────────────────────────────────────────────────────── */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-t border-b border-gray-100/60 bg-white">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">FECHA</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">COMPROBANTE</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">CLIENTE</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">PDF</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">XML</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">CDR</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">SUNAT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/60">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-400">
                                        No se encontraron comprobantes con ese criterio.
                                    </td>
                                </tr>
                            ) : filtered.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors bg-white">
                                    <td className="px-6 py-5 text-sm text-gray-900 font-medium whitespace-nowrap">{doc.fecha}</td>
                                    <td className="px-6 py-5 text-sm text-gray-800 whitespace-nowrap">{doc.comprobanteId}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{doc.clienteRuc}</span>
                                            <span className="text-sm text-gray-600">{doc.clienteNombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex justify-center items-center w-full h-full">
                                            <StatusIcon type="pdf" status={doc.pdfStatus} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex justify-center items-center w-full h-full">
                                            <StatusIcon type="xml" status={doc.xmlStatus} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex justify-center items-center w-full h-full">
                                            <StatusIcon type="cdr" status={doc.cdrStatus} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex justify-center items-center w-full h-full">
                                            <StatusIcon type="sunat" status={doc.sunatStatus} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Contador de resultados ────────────────────────────────────────── */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white w-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] relative z-10">
                    <p className="text-sm text-gray-500">
                        Mostrando {filtered.length} resultados
                    </p>
                </div>
            </Card>

        </div>
    );
}
