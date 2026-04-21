"use client";
import React, { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Calendar, Download,
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { cn } from '@/app/utils/cn';

// ─── Datos base (reemplaza con tu API) ────────────────────────────────────────
const ALL_DATA = {
  'Hoy': {
    ventas: [{ month: 'Hoy', ventas: 3200, igv: 576 }],
    clientes: [
      { name: 'Corporación Aceros SAC', docs: 1, sub: 'S/ 1,500.00', igv: 'S/ 270.00', total: 'S/ 1,770.00', subNum: 1500, igvNum: 270, totalNum: 1770 },
      { name: 'Tech Solutions Peru', docs: 1, sub: 'S/ 1,700.00', igv: 'S/ 306.00', total: 'S/ 2,006.00', subNum: 1700, igvNum: 306, totalNum: 2006 },
    ],
    stats: { ventas: 3200, igv: 576, docs: 12 },
    prevStats: { ventas: 2800, igv: 504, docs: 14 },
  },
  'Esta Semana': {
    ventas: [
      { month: 'Lun', ventas: 8000, igv: 1440 },
      { month: 'Mar', ventas: 9500, igv: 1710 },
      { month: 'Mie', ventas: 7200, igv: 1296 },
      { month: 'Jue', ventas: 11000, igv: 1980 },
      { month: 'Vie', ventas: 13500, igv: 2430 },
    ],
    clientes: [
      { name: 'Corporación Aceros SAC', docs: 4, sub: 'S/ 18,000.00', igv: 'S/ 3,240.00', total: 'S/ 21,240.00', subNum: 18000, igvNum: 3240, totalNum: 21240 },
      { name: 'Inversiones Globales EIRL', docs: 3, sub: 'S/ 12,000.00', igv: 'S/ 2,160.00', total: 'S/ 14,160.00', subNum: 12000, igvNum: 2160, totalNum: 14160 },
      { name: 'Tech Solutions Peru', docs: 2, sub: 'S/ 9,200.00', igv: 'S/ 1,656.00', total: 'S/ 10,856.00', subNum: 9200, igvNum: 1656, totalNum: 10856 },
    ],
    stats: { ventas: 49200, igv: 8856, docs: 89 },
    prevStats: { ventas: 44000, igv: 7920, docs: 95 },
  },
  'Este Mes': {
    ventas: [
      { month: 'Ene', ventas: 45000, igv: 8100 },
      { month: 'Feb', ventas: 52000, igv: 9360 },
      { month: 'Mar', ventas: 48000, igv: 8640 },
      { month: 'Abr', ventas: 61000, igv: 10980 },
      { month: 'May', ventas: 55000, igv: 9900 },
      { month: 'Jun', ventas: 67000, igv: 12060 },
    ],
    clientes: [
      { name: 'Corporación Aceros SAC', docs: 12, sub: 'S/ 12,500.00', igv: 'S/ 2,250.00', total: 'S/ 14,750.00', subNum: 12500, igvNum: 2250, totalNum: 14750 },
      { name: 'Inversiones Globales EIRL', docs: 8, sub: 'S/ 8,400.00', igv: 'S/ 1,512.00', total: 'S/ 9,912.00', subNum: 8400, igvNum: 1512, totalNum: 9912 },
      { name: 'Tech Solutions Peru', docs: 5, sub: 'S/ 4,200.00', igv: 'S/ 756.00', total: 'S/ 4,956.00', subNum: 4200, igvNum: 756, totalNum: 4956 },
      { name: 'Juan Pérez García', docs: 15, sub: 'S/ 2,100.00', igv: 'S/ 378.00', total: 'S/ 2,478.00', subNum: 2100, igvNum: 378, totalNum: 2478 },
    ],
    stats: { ventas: 55240, igv: 9943, docs: 1345 },
    prevStats: { ventas: 49100, igv: 8838, docs: 1378 },
  },
  'Este Año': {
    ventas: [
      { month: 'Ene', ventas: 145000, igv: 26100 },
      { month: 'Feb', ventas: 162000, igv: 29160 },
      { month: 'Mar', ventas: 148000, igv: 26640 },
      { month: 'Abr', ventas: 171000, igv: 30780 },
      { month: 'May', ventas: 155000, igv: 27900 },
      { month: 'Jun', ventas: 187000, igv: 33660 },
      { month: 'Jul', ventas: 193000, igv: 34740 },
      { month: 'Ago', ventas: 178000, igv: 32040 },
      { month: 'Sep', ventas: 201000, igv: 36180 },
      { month: 'Oct', ventas: 215000, igv: 38700 },
      { month: 'Nov', ventas: 224000, igv: 40320 },
      { month: 'Dic', ventas: 242000, igv: 43560 },
    ],
    clientes: [
      { name: 'Corporación Aceros SAC', docs: 142, sub: 'S/ 185,000.00', igv: 'S/ 33,300.00', total: 'S/ 218,300.00', subNum: 185000, igvNum: 33300, totalNum: 218300 },
      { name: 'Inversiones Globales EIRL', docs: 98, sub: 'S/ 124,000.00', igv: 'S/ 22,320.00', total: 'S/ 146,320.00', subNum: 124000, igvNum: 22320, totalNum: 146320 },
      { name: 'Tech Solutions Peru', docs: 74, sub: 'S/ 89,500.00', igv: 'S/ 16,110.00', total: 'S/ 105,610.00', subNum: 89500, igvNum: 16110, totalNum: 105610 },
      { name: 'Juan Pérez García', docs: 201, sub: 'S/ 42,000.00', igv: 'S/ 7,560.00', total: 'S/ 49,560.00', subNum: 42000, igvNum: 7560, totalNum: 49560 },
    ],
    stats: { ventas: 2221000, igv: 399780, docs: 15840 },
    prevStats: { ventas: 1980000, igv: 356400, docs: 14200 },
  },
};

const DATA_DOC_TYPES = [
  { name: 'Facturas', value: 450, color: '#0052CC' },
  { name: 'Boletas', value: 850, color: '#FF6321' },
  { name: 'Notas de Crédito', value: 45, color: '#6366f1' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcTrend(current: number, prev: number): { pct: string; isUp: boolean } {
  if (prev === 0) return { pct: '—', isUp: true };
  const diff = ((current - prev) / prev) * 100;
  return { pct: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, isUp: diff >= 0 };
}

function formatNum(n: number): string {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
type DateRange = 'Hoy' | 'Esta Semana' | 'Este Mes' | 'Este Año';

export default function ReportesPage() {
  const [dateRange, setDateRange] = useState<DateRange>('Este Mes');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const current = ALL_DATA[dateRange];

  const stats = useMemo(() => {
    const { ventas, igv, docs } = current.stats;
    const prev = current.prevStats;
    return [
      {
        label: 'Total Ventas (Inc. IGV)',
        value: formatNum(ventas),
        ...calcTrend(ventas, prev.ventas),
        icon: TrendingUp,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        label: 'IGV por Pagar',
        value: formatNum(igv),
        ...calcTrend(igv, prev.igv),
        icon: BarChart3,
        color: 'text-brand-blue',
        bg: 'bg-blue-50',
      },
      {
        label: 'Documentos Emitidos',
        value: docs.toLocaleString('es-PE'),
        ...calcTrend(docs, prev.docs),
        icon: PieChartIcon,
        color: 'text-brand-red',
        bg: 'bg-red-50',
      },
    ];
  }, [dateRange]);

  // Descarga PDF via API route (aquí simulamos con fetch al endpoint tuyo)
  const handleDownloadPdf = async () => {
    setLoadingPdf(true);
    try {
      const payload = {
        dateRange,
        stats: stats.map(s => ({ label: s.label, value: s.value, trend: s.pct, isUp: s.isUp })),
        clientes: current.clientes,
        ventas: current.ventas,
      };
      const res = await fetch('/api/auth/reportes/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error generando PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${dateRange.replace(' ', '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al generar el PDF. Verifica que el endpoint /api/reportes/pdf esté configurado.');
    } finally {
      setLoadingPdf(false);
    }
  };

  // Descarga Excel via API route
  const handleDownloadExcel = async () => {
    setLoadingExcel(true);
    try {
      const payload = {
        dateRange,
        clientes: current.clientes,
        ventas: current.ventas,
      };
const res = await fetch('/api/auth/reportes/excel', {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error generando Excel');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_clientes_${dateRange.replace(' ', '_')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al generar el Excel. Verifica que el endpoint /api/reportes/excel esté configurado.');
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header / Filtros ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-fit">
            {(['Hoy', 'Esta Semana', 'Este Mes', 'Este Año'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => { setDateRange(range); setShowCustom(false); }}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  dateRange === range && !showCustom
                    ? "bg-brand-blue text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Personalizar fechas */}
          {showCustom && (
            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-brand-blue/30 shadow-sm w-fit animate-in fade-in duration-200">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-blue"
              />
              <span className="text-gray-400 text-xs">→</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-blue"
              />
              <button
                onClick={() => setShowCustom(false)}
                className="text-xs font-bold px-3 py-1.5 bg-brand-blue text-white rounded-lg hover:opacity-90"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCustom(v => !v)}>
            <Calendar className="w-4 h-4" /> Personalizar
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadPdf}
            disabled={loadingPdf}
            className="min-w-[160px]"
          >
            {loadingPdf
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
              : <><Download className="w-4 h-4" /> Descargar PDF</>
            }
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
        {stats.map((stat, i) => (
          <Card key={i} className="p-0">
            <div className="p-0">
              <div className="flex justify-between items-start">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                  stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.pct}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-[14px] font-black text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Gráficas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Ventas Mensuales" subtitle="Comparativa de ventas e IGV generado">
          <div className="h-[350px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={current.ventas}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
             <Tooltip
  cursor={{ fill: '#f8fafc' }}
  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
  formatter={(value: number | undefined) =>
    value !== undefined ? `S/ ${value.toLocaleString('es-PE')}` : '—'
  }
/>
<Legend
  iconType="circle"
  wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
/>                <Bar dataKey="ventas" name="Ventas Totales" fill="#0052CC" radius={[4, 4, 0, 0]} barSize={20}  />
                <Bar dataKey="igv" name="IGV Generado" fill="#FF6321" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Distribución de Documentos" subtitle="Porcentaje por tipo de comprobante">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DATA_DOC_TYPES}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {DATA_DOC_TYPES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
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

      {/* ── Tabla Clientes ── */}
      <Card
        title="Resumen Detallado por Cliente"
        action={
          <Button
            variant="ghost"
            className="text-brand-blue"
            onClick={handleDownloadExcel}
            disabled={loadingExcel}
          >
            {loadingExcel
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
              : <><Download className="w-4 h-4" /> Exportar Excel</>
            }
          </Button>
        }
      >
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
              {current.clientes.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{row.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{row.docs}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{row.sub}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{row.igv}</td>
                  <td className="px-6 py-4 text-sm font-bold text-brand-blue text-right">{row.total}</td>
                </tr>
              ))}
              {/* Fila totales */}
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-6 py-4 text-sm font-black text-gray-900">TOTAL</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700 text-center">
                  {current.clientes.reduce((s, c) => s + c.docs, 0)}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700 text-right">
                  {formatNum(current.clientes.reduce((s, c) => s + c.subNum, 0))}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-orange-500 text-right">
                  {formatNum(current.clientes.reduce((s, c) => s + c.igvNum, 0))}
                </td>
                <td className="px-6 py-4 text-sm font-black text-brand-blue text-right">
                  {formatNum(current.clientes.reduce((s, c) => s + c.totalNum, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}