"use client";
import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Zap, 
  ChevronRight 
} from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';


import { SALES_DATA, RECENT_DOCS } from '../data/mockData';
import { cn } from '@/app/utils/cn';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';


export const DashboardView = ({ onNewDoc }: { onNewDoc: () => void }) => {
  const handleExport = () => {
    const headers = "Fecha,ID Comprobante,Cliente,Total,Estado\n";
    const rows = RECENT_DOCS.map(doc => `${doc.date},${doc.id},"${doc.client}",${doc.total},${doc.status}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas del Día', value: 'S/ 4,250.80', icon: BarChart3, color: 'text-brand-red', bg: 'bg-red-50' },
          { label: 'Facturas Emitidas', value: '124', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Boletas Emitidas', value: '856', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Estado SUNAT', value: 'Conectado', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <Card key={i} className="p-0">
            <div className="p-5 flex items-center gap-4">
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
                    <stop offset="5%" stopColor="#0052CC" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0052CC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#0052CC" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* SUNAT Notifications */}
        <Card title="Notificaciones SUNAT" subtitle="Estado de comprobantes y alertas" className="border-t-4 border-t-brand-red">
          <div className="space-y-4 mt-2">
            {[
              { title: 'CDR Aceptado', desc: 'Factura F001-123 aceptada con éxito.', time: 'Hace 5 min', type: 'success' },
              { title: 'Pendiente de Envío', desc: '3 boletas pendientes de envío manual.', time: 'Hace 1 hora', type: 'warning' },
              { title: 'Certificado Digital', desc: 'Vence en 15 días (05/06/2024).', time: 'Sistema', type: 'error' },
            ].map((notif, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
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
            <Button variant="outline" className="w-full mt-2">Ver todas las alertas</Button>
          </div>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card title="Comprobantes Recientes" action={<Button variant="ghost" className="text-brand-blue">Ver todos <ChevronRight className="w-4 h-4" /></Button>}>
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
              {RECENT_DOCS.map((doc, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-brand-blue">{doc.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{doc.client}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.date}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{doc.total}</td>
                  <td className="px-6 py-4">
                    <Badge variant={doc.status === 'Aceptado' ? 'success' : doc.status === 'Pendiente' ? 'warning' : 'error'}>
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};


const MoreVertical = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
);
