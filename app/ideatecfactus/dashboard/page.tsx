"use client";
import React, { useState } from 'react';
import {
  BarChart3, FileText, Zap, ChevronRight, X,
  Send, RotateCcw, CheckCircle2, AlertTriangle,
  XCircle, Bell, ChevronDown, Clock,
  ShieldCheck, AlertCircle, Calendar, Building2, Hash, AtSign, Eye, Download, Mail
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts';
import { useRouter } from 'next/navigation';
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

// ─── Mock Data ─────────────────────────────────────────────────────────────────

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
        {/* Lista */}
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

        {/* Detalle */}
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

// ─── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [showTodasAlertas, setShowTodasAlertas] = useState(false);

  const statusBadgeClass = (status: string) => ({
    Aceptado: 'success',
    Pendiente: 'warning',
    Rechazado: 'error',
  }[status] as 'success' | 'warning' | 'error');

  return (
    <>
      {showTodasAlertas && <TodasAlertasModal onClose={() => setShowTodasAlertas(false)} />}

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
            <div className="h-75 w-full mt-4">
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

        {/* Comprobantes Recientes — sin columna Acciones */}
        <Card
          title="Comprobantes Recientes"
          action={
            <Button
              variant="ghost"
              className="text-brand-blue"
              onClick={() => router.push('/ideatecfactus/ver-comprobantes')}
            >
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ALL_COMPROBANTES.slice(0, 5).map((doc, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-brand-blue">{doc.id}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{doc.client}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.date}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{doc.total}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusBadgeClass(doc.status)}>
                        {doc.status}
                      </Badge>
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