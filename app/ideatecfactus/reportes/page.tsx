"use client";
import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, Calendar, Download,
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { cn } from '@/app/utils/cn';

const DATA_VENTAS_MENSUAL = [
  { month: 'Ene', ventas: 45000, igv: 8100 },
  { month: 'Feb', ventas: 52000, igv: 9360 },
  { month: 'Mar', ventas: 48000, igv: 8640 },
  { month: 'Abr', ventas: 61000, igv: 10980 },
  { month: 'May', ventas: 55000, igv: 9900 },
  { month: 'Jun', ventas: 67000, igv: 12060 },
];

const DATA_DOC_TYPES = [
  { name: 'Facturas', value: 450, color: '#0052CC' },
  { name: 'Boletas', value: 850, color: '#FF6321' },
  { name: 'Notas de Crédito', value: 45, color: '#6366f1' },
];

export default function ReportesPage() {
  const [dateRange, setDateRange] = useState('Este Mes');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {['Hoy', 'Esta Semana', 'Este Mes', 'Este Año'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                dateRange === range ? "bg-brand-blue text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Calendar className="w-4 h-4" /> Personalizar</Button>
          <Button variant="secondary"><Download className="w-4 h-4" /> Descargar PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Ventas (Inc. IGV)', value: 'S/ 55,240.00', trend: '+12.5%', isUp: true, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'IGV por Pagar', value: 'S/ 9,943.20', trend: '+8.2%', isUp: true, icon: BarChart3, color: 'text-brand-blue', bg: 'bg-blue-50' },
          { label: 'Documentos Emitidos', value: '1,345', trend: '-2.4%', isUp: false, icon: PieChartIcon, color: 'text-brand-red', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <Card key={i} className="p-0">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                  stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Ventas Mensuales" subtitle="Comparativa de ventas e IGV generado">
          <div className="h-[350px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA_VENTAS_MENSUAL}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="ventas" name="Ventas Totales" fill="#0052CC" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="igv" name="IGV Generado" fill="#FF6321" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Distribución de Documentos" subtitle="Porcentaje por tipo de comprobante">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DATA_DOC_TYPES} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {DATA_DOC_TYPES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {DATA_DOC_TYPES.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Resumen Detallado por Cliente" action={<Button variant="ghost" className="text-brand-blue">Exportar Excel <Download className="w-4 h-4" /></Button>}>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">N° Docs</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Subtotal</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">IGV</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { name: 'Corporación Aceros SAC', docs: 12, sub: 'S/ 12,500.00', igv: 'S/ 2,250.00', total: 'S/ 14,750.00' },
                { name: 'Inversiones Globales EIRL', docs: 8, sub: 'S/ 8,400.00', igv: 'S/ 1,512.00', total: 'S/ 9,912.00' },
                { name: 'Tech Solutions Peru', docs: 5, sub: 'S/ 4,200.00', igv: 'S/ 756.00', total: 'S/ 4,956.00' },
                { name: 'Juan Pérez García', docs: 15, sub: 'S/ 2,100.00', igv: 'S/ 378.00', total: 'S/ 2,478.00' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{row.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{row.docs}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{row.sub}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{row.igv}</td>
                  <td className="px-6 py-4 text-sm font-bold text-brand-blue text-right">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}