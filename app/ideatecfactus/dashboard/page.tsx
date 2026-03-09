"use client";
import React, { useState } from 'react';
import {
  BarChart3, FileText, Zap, ChevronRight, X, Download, Eye,
  Send, RotateCcw, CheckCircle2, AlertTriangle,
  XCircle, Bell, Search, ChevronDown, Clock,
  ShieldCheck, AlertCircle, Calendar, Building2, Hash, Mail, AtSign
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts';
import { RECENT_DOCS, SALES_DATA } from '@/app/components/data/mockData';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { cn } from '@/app/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Comprobante {
  id: string;
  client: string;
  ruc: string;
  date: string;
  total: string;
  status: 'Aceptado' | 'Pendiente' | 'Rechazado';
  type: 'Factura' | 'Boleta' | 'Nota de Crédito' | 'Guía de Remisión';
  igv: string;
  subtotal: string;
  serie: string;
  correlativo: string;
}

interface Notificacion {
  id: number;
  title: string;
  desc: string;
  time: string;
  type: 'success' | 'warning' | 'error' | 'info';
  detail: string;
  fecha: string;
  comprobante?: string;
}

// ─── Mock Data Extendido ───────────────────────────────────────────────────────

const ALL_COMPROBANTES: Comprobante[] = [
  { id: 'F001-00124', client: 'Corporación Lima SAC', ruc: '20501234567', date: '15/01/2025', total: 'S/ 1,180.00', igv: 'S/ 180.00', subtotal: 'S/ 1,000.00', status: 'Aceptado', type: 'Factura', serie: 'F001', correlativo: '00124' },
  { id: 'B001-00856', client: 'Juan Pérez García', ruc: '10234567890', date: '15/01/2025', total: 'S/ 59.00', igv: 'S/ 9.00', subtotal: 'S/ 50.00', status: 'Aceptado', type: 'Boleta', serie: 'B001', correlativo: '00856' },
  { id: 'F001-00123', client: 'Inversiones del Norte EIRL', ruc: '20123456789', date: '14/01/2025', total: 'S/ 2,360.00', igv: 'S/ 360.00', subtotal: 'S/ 2,000.00', status: 'Pendiente', type: 'Factura', serie: 'F001', correlativo: '00123' },
  { id: 'B001-00855', client: 'María Torres Quispe', ruc: '10345678901', date: '14/01/2025', total: 'S/ 118.00', igv: 'S/ 18.00', subtotal: 'S/ 100.00', status: 'Aceptado', type: 'Boleta', serie: 'B001', correlativo: '00855' },
  { id: 'F001-00122', client: 'Grupo Andino SA', ruc: '20456789012', date: '13/01/2025', total: 'S/ 5,900.00', igv: 'S/ 900.00', subtotal: 'S/ 5,000.00', status: 'Rechazado', type: 'Factura', serie: 'F001', correlativo: '00122' },
  { id: 'NC01-00012', client: 'Corporación Lima SAC', ruc: '20501234567', date: '13/01/2025', total: 'S/ -590.00', igv: 'S/ -90.00', subtotal: 'S/ -500.00', status: 'Aceptado', type: 'Nota de Crédito', serie: 'NC01', correlativo: '00012' },
  { id: 'B001-00854', client: 'Carlos Mendoza Ríos', ruc: '10456789012', date: '12/01/2025', total: 'S/ 236.00', igv: 'S/ 36.00', subtotal: 'S/ 200.00', status: 'Aceptado', type: 'Boleta', serie: 'B001', correlativo: '00854' },
  { id: 'F001-00121', client: 'Tech Solutions Peru SAC', ruc: '20567890123', date: '12/01/2025', total: 'S/ 8,850.00', igv: 'S/ 1,350.00', subtotal: 'S/ 7,500.00', status: 'Aceptado', type: 'Factura', serie: 'F001', correlativo: '00121' },
  { id: 'GR01-00045', client: 'Distribuidora Central SAC', ruc: '20678901234', date: '11/01/2025', total: 'S/ 0.00', igv: 'S/ 0.00', subtotal: 'S/ 0.00', status: 'Aceptado', type: 'Guía de Remisión', serie: 'GR01', correlativo: '00045' },
  { id: 'B001-00853', client: 'Ana Lucía Flores', ruc: '10567890123', date: '11/01/2025', total: 'S/ 47.20', igv: 'S/ 7.20', subtotal: 'S/ 40.00', status: 'Pendiente', type: 'Boleta', serie: 'B001', correlativo: '00853' },
];

const ALL_NOTIFICACIONES: Notificacion[] = [
  { id: 1, title: 'CDR Aceptado', desc: 'Factura F001-00124 aceptada con éxito.', time: 'Hace 5 min', type: 'success', detail: 'El comprobante F001-00124 emitido a Corporación Lima SAC por S/ 1,180.00 fue aceptado correctamente por SUNAT. CDR recibido con estado 0 (Aceptado).', fecha: '15/01/2025 09:32', comprobante: 'F001-00124' },
  { id: 2, title: 'Pendiente de Envío', desc: '3 boletas pendientes de envío manual.', time: 'Hace 1 hora', type: 'warning', detail: 'Las boletas B001-00853, B001-00851 y B001-00849 no han podido enviarse automáticamente. Por favor, realice el envío manual desde el módulo de emisión.', fecha: '15/01/2025 08:45', comprobante: undefined },
  { id: 3, title: 'Certificado Digital', desc: 'Vence en 15 días (05/06/2025).', time: 'Sistema', type: 'error', detail: 'Su certificado digital de firma electrónica vence el 05 de junio de 2025. Es imprescindible renovarlo para continuar emitiendo comprobantes electrónicos. Contacte a su proveedor de certificados.', fecha: '15/01/2025 00:00', comprobante: undefined },
  { id: 4, title: 'Sincronización OSE', desc: 'Sincronización completada con Digiflow.', time: 'Hace 2 horas', type: 'success', detail: 'Se completó la sincronización masiva con el OSE Digiflow. 47 comprobantes enviados, 47 aceptados, 0 rechazados.', fecha: '15/01/2025 07:00', comprobante: undefined },
  { id: 5, title: 'Factura Rechazada', desc: 'F001-00122 rechazada por SUNAT (2329).', time: 'Hace 3 horas', type: 'error', detail: 'La factura F001-00122 fue rechazada por SUNAT con error 2329: "El RUC del emisor no está habilitado para emitir este tipo de comprobante". Verifique su estado ante SUNAT y reactive su clave SOL.', fecha: '14/01/2025 22:15', comprobante: 'F001-00122' },
  { id: 6, title: 'Nuevo Periodo Contable', desc: 'Inicio de periodo Enero 2025.', time: 'Hace 1 día', type: 'info', detail: 'Se ha iniciado automáticamente el periodo contable Enero 2025. Los correlativos de facturas y boletas han sido reiniciados según la configuración de su empresa.', fecha: '01/01/2025 00:00', comprobante: undefined },
];

// ─── Modal Base ────────────────────────────────────────────────────────────────

const Modal: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ open, onClose, children, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200",
        wide ? "max-w-4xl" : "max-w-lg"
      )}>
        {children}
      </div>
    </div>
  );
};

const ModalHeader: React.FC<{ title: string; subtitle?: string; onClose: () => void; icon?: React.ReactNode; iconColor?: string }> = ({ title, subtitle, onClose, icon, iconColor = 'bg-blue-100 text-blue-700' }) => (
  <div className="flex items-center gap-3 p-6 border-b border-slate-100 shrink-0">
    {icon && (
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconColor)}>
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0">
      <X size={18} />
    </button>
  </div>
);

// ─── Modal: Enviar por Correo ──────────────────────────────────────────────────

const EnviarCorreoModal: React.FC<{ doc: Comprobante; onClose: () => void }> = ({ doc, onClose }) => {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState(`Estimado cliente,\n\nAdjunto encontrará el comprobante electrónico ${doc.id} por un importe de ${doc.total}.\n\nGracias por su preferencia.\n\nIDEATEC Factus`);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  return (
    <Modal open onClose={onClose}>
      <ModalHeader
        title="Enviar por Correo"
        subtitle={`Comprobante ${doc.id} · ${doc.total}`}
        onClose={onClose}
        icon={<Mail size={18} />}
        iconColor="bg-blue-100 text-blue-700"
      />
      {sent ? (
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <p className="text-base font-bold text-slate-900 mb-1">¡Correo enviado!</p>
          <p className="text-sm text-slate-500 mb-5">El comprobante fue enviado a <span className="font-semibold text-slate-700">{email}</span></p>
          <button onClick={onClose} className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-sm transition-colors">Cerrar</button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Destinatario</label>
            <div className="relative">
              <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@cliente.com"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Mensaje (opcional)</label>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all resize-none"
            />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={14} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800">{doc.id}.pdf</p>
              <p className="text-[11px] text-slate-400">Comprobante electrónico · PDF</p>
            </div>
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          </div>
          <button
            type="submit"
            disabled={sending || !email}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-900 hover:bg-blue-950 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors"
          >
            {sending ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
            ) : (
              <><Send size={14} /> Enviar comprobante</>
            )}
          </button>
        </form>
      )}
    </Modal>
  );
};

// ─── Modal: Detalle de Comprobante ─────────────────────────────────────────────

const DetalleComprobanteModal: React.FC<{ doc: Comprobante | null; onClose: () => void }> = ({ doc, onClose }) => {
  const [showEnviarCorreo, setShowEnviarCorreo] = useState(false);
  if (!doc) return null;

  const statusConfig = {
    Aceptado: { icon: <CheckCircle2 size={14} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Pendiente: { icon: <Clock size={14} />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    Rechazado: { icon: <XCircle size={14} />, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const cfg = statusConfig[doc.status];

  return (
    <>
      {showEnviarCorreo && <EnviarCorreoModal doc={doc} onClose={() => setShowEnviarCorreo(false)} />}
      <Modal open={!!doc} onClose={onClose}>
        <ModalHeader
          title={doc.id}
          subtitle={`${doc.type} · ${doc.date}`}
          onClose={onClose}
          icon={<FileText size={18} />}
          iconColor="bg-blue-100 text-blue-700"
        />

        <div className="overflow-y-auto p-6 space-y-5">
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold w-fit", cfg.color)}>
            {cfg.icon}
            Estado SUNAT: {doc.status}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Cliente / Receptor', value: doc.client, icon: <Building2 size={13} /> },
              { label: 'RUC / DNI', value: doc.ruc, icon: <Hash size={13} /> },
              { label: 'Fecha de Emisión', value: doc.date, icon: <Calendar size={13} /> },
              { label: 'Tipo de Comprobante', value: doc.type, icon: <FileText size={13} /> },
              { label: 'Serie', value: doc.serie, icon: <Hash size={13} /> },
              { label: 'Correlativo', value: doc.correlativo, icon: <Hash size={13} /> },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  {item.icon} {item.label}
                </p>
                <p className="text-sm font-semibold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumen de Importes</p>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { label: 'Subtotal (sin IGV)', value: doc.subtotal },
                { label: 'IGV (18%)', value: doc.igv },
              ].map((row, i) => (
                <div key={i} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-medium text-slate-800">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3 bg-blue-50">
                <span className="text-sm font-bold text-blue-900">TOTAL</span>
                <span className="text-sm font-bold text-blue-900">{doc.total}</span>
              </div>
            </div>
          </div>

          {doc.status === 'Rechazado' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-800">Comprobante rechazado</p>
                <p className="text-xs text-rose-600 mt-0.5">Corrija los datos y vuelva a emitir el comprobante. No puede reenviarse el mismo.</p>
              </div>
            </div>
          )}
          {doc.status === 'Pendiente' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Pendiente de envío a SUNAT</p>
                <p className="text-xs text-amber-600 mt-0.5">Use el botón "Reenviar" para intentar el envío manual al OSE/SUNAT.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer acciones — horizontal directo, sin menú desplegable */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 shrink-0 flex-wrap">
          <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors">
            <Eye size={13} /> Ver PDF
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors">
            <Download size={13} /> Descargar PDF
          </button>
          {doc.status === 'Aceptado' && (
            <button
              onClick={() => setShowEnviarCorreo(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Send size={13} /> Enviar por correo
            </button>
          )}
          {doc.status === 'Pendiente' && (
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors">
              <RotateCcw size={13} /> Reenviar a SUNAT
            </button>
          )}
        </div>
      </Modal>
    </>
  );
};

// ─── Modal: Todos los Comprobantes ─────────────────────────────────────────────

const TodosComprobantesModal: React.FC<{ onClose: () => void; onSelect: (doc: Comprobante) => void }> = ({ onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterType, setFilterType] = useState<string>('Todos');

  const filtered = ALL_COMPROBANTES.filter(doc => {
    const matchSearch = doc.id.toLowerCase().includes(search.toLowerCase()) ||
      doc.client.toLowerCase().includes(search.toLowerCase()) ||
      doc.ruc.includes(search);
    const matchStatus = filterStatus === 'Todos' || doc.status === filterStatus;
    const matchType = filterType === 'Todos' || doc.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const statusBadgeClass = (status: string) => ({
    Aceptado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Pendiente: 'bg-amber-50 text-amber-700 border border-amber-200',
    Rechazado: 'bg-rose-50 text-rose-700 border border-rose-200',
  }[status] ?? '');

  return (
    <Modal open onClose={onClose} wide>
      <ModalHeader
        title="Todos los Comprobantes"
        subtitle={`${filtered.length} comprobantes encontrados`}
        onClose={onClose}
        icon={<FileText size={18} />}
        iconColor="bg-blue-100 text-blue-700"
      />

      {/* Filtros */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente o RUC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
          >
            {['Todos', 'Aceptado', 'Pendiente', 'Rechazado'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
          >
            {['Todos', 'Factura', 'Boleta', 'Nota de Crédito', 'Guía de Remisión'].map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
            <tr>
              {['Comprobante', 'Cliente / RUC', 'Fecha', 'Total', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                  No se encontraron comprobantes con ese criterio.
                </td>
              </tr>
            ) : filtered.map((doc, i) => (
              <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-blue-700">{doc.id}</p>
                    <p className="text-[11px] text-slate-400">{doc.type}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{doc.client}</p>
                  <p className="text-[11px] text-slate-400">{doc.ruc}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{doc.date}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">{doc.total}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold", statusBadgeClass(doc.status))}>
                    {doc.status === 'Aceptado' && <CheckCircle2 size={10} />}
                    {doc.status === 'Pendiente' && <Clock size={10} />}
                    {doc.status === 'Rechazado' && <XCircle size={10} />}
                    {doc.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { onSelect(doc); onClose(); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Eye size={12} /> Ver
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap">
                      <Download size={12} /> PDF
                    </button>
                    {doc.status === 'Aceptado' && (
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap">
                        <Send size={12} /> Correo
                      </button>
                    )}
                    {doc.status === 'Pendiente' && (
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap">
                        <RotateCcw size={12} /> Reenviar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
        <p className="text-xs text-slate-400">Mostrando {filtered.length} de {ALL_COMPROBANTES.length} comprobantes</p>
        <button className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors">
          <Download size={13} /> Exportar a Excel
        </button>
      </div>
    </Modal>
  );
};

// ─── Modal: Todas las Alertas SUNAT ───────────────────────────────────────────

const TodasAlertasModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selected, setSelected] = useState<Notificacion | null>(ALL_NOTIFICACIONES[0]);

  const iconConfig = {
    success: { icon: <CheckCircle2 size={16} />, dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', label: 'Éxito' },
    warning: { icon: <AlertTriangle size={16} />, dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', label: 'Advertencia' },
    error: { icon: <XCircle size={16} />, dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700', label: 'Error' },
    info: { icon: <Bell size={16} />, dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700', label: 'Info' },
  };

  return (
    <Modal open onClose={onClose} wide>
      <ModalHeader
        title="Notificaciones SUNAT"
        subtitle="Historial completo de alertas y eventos"
        onClose={onClose}
        icon={<Bell size={18} />}
        iconColor="bg-red-100 text-red-600"
      />

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, height: '520px' }}>
        {/* Lista de notificaciones */}
        <div className="w-[42%] border-r border-slate-100 overflow-y-auto shrink-0">
          {ALL_NOTIFICACIONES.map((notif) => {
            const cfg = iconConfig[notif.type];
            return (
              <button
                key={notif.id}
                onClick={() => setSelected(notif)}
                className={cn(
                  "w-full text-left flex gap-3 p-4 border-b border-slate-50 transition-colors",
                  selected?.id === notif.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                )}
              >
                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", cfg.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{notif.title}</p>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0", cfg.badge)}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notif.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">{notif.time}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalle de notificación */}
        {selected ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", {
                'bg-emerald-100 text-emerald-600': selected.type === 'success',
                'bg-amber-100 text-amber-600': selected.type === 'warning',
                'bg-rose-100 text-rose-600': selected.type === 'error',
                'bg-blue-100 text-blue-600': selected.type === 'info',
              })}>
                {iconConfig[selected.type].icon}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{selected.title}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={11} /> {selected.fecha}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700 leading-relaxed">{selected.detail}</p>
            </div>

            {selected.comprobante && (
              <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/50">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Comprobante Relacionado</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">{selected.comprobante}</span>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Eye size={12} /> Ver comprobante
                  </button>
                </div>
              </div>
            )}

            {selected.type === 'error' && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Acciones recomendadas</p>
                <div className="space-y-2">
                  {selected.id === 3 ? (
                    <>
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg transition-colors">
                        <ShieldCheck size={14} /> Renovar certificado digital
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">
                        <Send size={14} /> Contactar soporte técnico
                      </button>
                    </>
                  ) : (
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-colors">
                      <RotateCcw size={14} /> Corregir y reemitir comprobante
                    </button>
                  )}
                </div>
              </div>
            )}
            {selected.type === 'warning' && (
              <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-colors">
                <Send size={14} /> Enviar comprobantes pendientes
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Selecciona una notificación
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── Acciones inline horizontales ─────────────────────────────────────────────

const AccionesInline: React.FC<{
  doc: Comprobante;
  onVerDetalle: () => void;
  onEnviarCorreo: () => void;
}> = ({ doc, onVerDetalle, onEnviarCorreo }) => (
  <div className="flex items-center justify-end gap-1.5">
    <button
      onClick={onVerDetalle}
      title="Ver detalle"
      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
    >
      <Eye size={12} /> Ver
    </button>
    <button
      title="Descargar PDF"
      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
    >
      <Download size={12} /> PDF
    </button>
    {doc.status === 'Aceptado' && (
      <button
        onClick={onEnviarCorreo}
        title="Enviar por correo"
        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
      >
        <Send size={12} /> Correo
      </button>
    )}
    {doc.status === 'Pendiente' && (
      <button
        title="Reenviar a SUNAT"
        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap"
      >
        <RotateCcw size={12} /> Reenviar
      </button>
    )}
  </div>
);

// ─── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [detalleDoc, setDetalleDoc] = useState<Comprobante | null>(null);
  const [correoDoc, setCorreoDoc] = useState<Comprobante | null>(null);
  const [showTodosComprobantes, setShowTodosComprobantes] = useState(false);
  const [showTodasAlertas, setShowTodasAlertas] = useState(false);

  const statusBadgeClass = (status: string) => ({
    Aceptado: 'success',
    Pendiente: 'warning',
    Rechazado: 'error',
  }[status] as 'success' | 'warning' | 'error');

  return (
    <>
      {/* ── Modales ─────────────────────────────────────────────────────────── */}
      <DetalleComprobanteModal doc={detalleDoc} onClose={() => setDetalleDoc(null)} />
      {correoDoc && <EnviarCorreoModal doc={correoDoc} onClose={() => setCorreoDoc(null)} />}
      {showTodosComprobantes && (
        <TodosComprobantesModal
          onClose={() => setShowTodosComprobantes(false)}
          onSelect={(doc) => { setDetalleDoc(doc); setShowTodosComprobantes(false); }}
        />
      )}
      {showTodasAlertas && <TodasAlertasModal onClose={() => setShowTodasAlertas(false)} />}

      {/* ── Layout ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4 animate-in fade-in duration-500">

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Ventas del Día', value: 'S/ 4,250.80', icon: BarChart3, color: 'text-brand-red', bg: 'bg-red-50' },
            { label: 'Facturas Emitidas', value: '124', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Boletas Emitidas', value: '856', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Estado SUNAT', value: 'Conectado', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((kpi, i) => (
            <Card key={i} className="p-0">
              <div className="p-2 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", kpi.bg)}>
                  <kpi.icon className={cn("w-6 h-6", kpi.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{kpi.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card className="lg:col-span-2" title="Rendimiento de Ventas" subtitle="Resumen de los últimos 7 días">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SALES_DATA}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0052CC" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0052CC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="sales" stroke="#0052CC" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* SUNAT Notifications */}
          <Card title="Notificaciones SUNAT" subtitle="Estado de comprobantes y alertas" className="border-t-4 border-t-brand-red">
            <div className="space-y-4 mt-2">
              {ALL_NOTIFICACIONES.slice(0, 3).map((notif) => (
                <div
                  key={notif.id}
                  className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                  onClick={() => setShowTodasAlertas(true)}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    notif.type === 'success' ? 'bg-emerald-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                  )} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.desc}</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">{notif.time}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2" onClick={() => setShowTodasAlertas(true)}>
                Ver todas las alertas
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card
          title="Comprobantes Recientes"
          action={
            <Button variant="ghost" className="text-brand-blue" onClick={() => setShowTodosComprobantes(true)}>
              Ver todos <ChevronRight className="w-4 h-4" />
            </Button>
          }
        >
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Comprobante</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ALL_COMPROBANTES.slice(0, 5).map((doc, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setDetalleDoc(doc)}
                        className="text-sm font-medium text-brand-blue hover:underline"
                      >
                        {doc.id}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{doc.client}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.date}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{doc.total}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusBadgeClass(doc.status)}>
                        {doc.status}
                      </Badge>
                    </td>
                    {/* ✅ Botones directos horizontales, sin menú desplegable */}
                    <td className="px-6 py-4">
                      <AccionesInline
                        doc={doc}
                        onVerDetalle={() => setDetalleDoc(doc)}
                        onEnviarCorreo={() => setCorreoDoc(doc)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}