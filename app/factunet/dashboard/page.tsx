"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  FileText,
  Zap,
  ChevronRight,
  X,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bell,
  Calendar,
  ShieldCheck,
  Eye,
  Plus,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { cn } from "@/app/utils/cn";
import { useAuth } from "@/context/AuthContext";
import { useDashboardEmpresa } from "./gestionDashboard/UseDashboardEmpresa";
import { useDashboardSucursal } from "./gestionDashboard/UseDashboardSucursal";

import { Skeleton } from "@/app/components/ui/Skeleton";
import { useSucursalRuc } from "../operaciones/boleta/gestionBoletas/useSucursalRuc";
import { DropdownSucursal } from "@/app/components/ui/DropdownSucursal";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Notificacion {
  id: number;
  title: string;
  desc: string;
  time: string;
  type: "success" | "warning" | "error" | "info";
  detail: string;
  fecha: string;
  comprobante?: string;
}

// ─── Mock Notificaciones ───────────────────────────────────────────────────────

const ALL_NOTIFICACIONES: Notificacion[] = [
  {
    id: 1,
    title: "CDR Aceptado",
    desc: "Factura F001-00124 aceptada con éxito.",
    time: "Hace 5 min",
    type: "success",
    detail:
      "El comprobante F001-00124 emitido a Corporación Lima SAC por S/ 1,180.00 fue aceptado correctamente por SUNAT. CDR recibido con estado 0 (Aceptado).",
    fecha: "15/01/2025 09:32",
    comprobante: "F001-00124",
  },
  {
    id: 2,
    title: "Pendiente de Envío",
    desc: "3 boletas pendientes de envío manual.",
    time: "Hace 1 hora",
    type: "warning",
    detail:
      "Las boletas B001-00853, B001-00851 y B001-00849 no han podido enviarse automáticamente.",
    fecha: "15/01/2025 08:45",
  },
  {
    id: 3,
    title: "Certificado Digital",
    desc: "Vence en 15 días (05/06/2025).",
    time: "Sistema",
    type: "error",
    detail:
      "Su certificado digital de firma electrónica vence el 05 de junio de 2025.",
    fecha: "15/01/2025 00:00",
  },
  {
    id: 4,
    title: "Sincronización OSE",
    desc: "Sincronización completada con Digiflow.",
    time: "Hace 2 horas",
    type: "success",
    detail:
      "Se completó la sincronización masiva con el OSE Digiflow. 47 comprobantes enviados, 47 aceptados.",
    fecha: "15/01/2025 07:00",
  },
  {
    id: 5,
    title: "Factura Rechazada",
    desc: "F001-00122 rechazada por SUNAT (2329).",
    time: "Hace 3 horas",
    type: "error",
    detail: "La factura F001-00122 fue rechazada por SUNAT con error 2329.",
    fecha: "14/01/2025 22:15",
    comprobante: "F001-00122",
  },
  {
    id: 6,
    title: "Nuevo Periodo Contable",
    desc: "Inicio de periodo Enero 2025.",
    time: "Hace 1 día",
    type: "info",
    detail: "Se ha iniciado automáticamente el periodo contable Enero 2025.",
    fecha: "01/01/2025 00:00",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatFecha = (fechaStr: string) => {
  const date = new Date(fechaStr);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatMoneda = (valor: number) =>
  `S/ ${valor.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getFechaHoy = (): string => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
  };

const estadoSunatLabel = (estado: string) => {
  const map: Record<string, "success" | "warning" | "error"> = {
    ACEPTADO: "success",
    PENDIENTE: "warning",
    RECHAZADO: "error",
    ACEPTADO_CON_OBSERVACIONES: "warning",
  };
  return map[estado?.toUpperCase()] ?? "warning";
};

// ─── Modal Base ────────────────────────────────────────────────────────────────

const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ open, onClose, children, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200",
          wide ? "max-w-4xl" : "max-w-lg",
        )}
      >
        {children}
      </div>
    </div>
  );
};

const ModalHeader: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  icon?: React.ReactNode;
  iconColor?: string;
}> = ({
  title,
  subtitle,
  onClose,
  icon,
  iconColor = "bg-blue-100 text-blue-700",
}) => (
  <div className="flex items-center gap-3 p-6 border-b border-slate-100 shrink-0">
    {icon && (
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          iconColor,
        )}
      >
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
    >
      <X size={18} />
    </button>
  </div>
);

// ─── Modal: Todas las Alertas SUNAT ───────────────────────────────────────────

const TodasAlertasModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selected, setSelected] = useState<Notificacion | null>(
    ALL_NOTIFICACIONES[0],
  );

  const iconConfig = {
    success: {
      icon: <CheckCircle2 size={16} />,
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700",
      label: "Éxito",
    },
    warning: {
      icon: <AlertTriangle size={16} />,
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700",
      label: "Advertencia",
    },
    error: {
      icon: <XCircle size={16} />,
      dot: "bg-rose-500",
      badge: "bg-rose-50 text-rose-700",
      label: "Error",
    },
    info: {
      icon: <Bell size={16} />,
      dot: "bg-blue-500",
      badge: "bg-blue-50 text-blue-700",
      label: "Info",
    },
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
      <div
        className="flex flex-1 overflow-hidden"
        style={{ minHeight: 0, height: "520px" }}
      >
        <div className="w-[42%] border-r border-slate-100 overflow-y-auto shrink-0">
          {ALL_NOTIFICACIONES.map((notif) => {
            const cfg = iconConfig[notif.type];
            return (
              <button
                key={notif.id}
                onClick={() => setSelected(notif)}
                className={cn(
                  "w-full text-left flex gap-3 p-4 border-b border-slate-50 transition-colors",
                  selected?.id === notif.id
                    ? "bg-blue-50 border-l-2 border-l-blue-600"
                    : "hover:bg-slate-50 border-l-2 border-l-transparent",
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    cfg.dot,
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      {notif.title}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                        cfg.badge,
                      )}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                    {notif.desc}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                    {notif.time}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {selected ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  {
                    "bg-emerald-100 text-emerald-600":
                      selected.type === "success",
                    "bg-amber-100 text-amber-600": selected.type === "warning",
                    "bg-rose-100 text-rose-600": selected.type === "error",
                    "bg-blue-100 text-blue-600": selected.type === "info",
                  },
                )}
              >
                {iconConfig[selected.type].icon}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {selected.title}
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={11} /> {selected.fecha}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                {selected.detail}
              </p>
            </div>
            {selected.comprobante && (
              <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/50">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                  Comprobante Relacionado
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">
                      {selected.comprobante}
                    </span>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Eye size={12} /> Ver comprobante
                  </button>
                </div>
              </div>
            )}
            {selected.type === "error" && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">
                  Acciones recomendadas
                </p>
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
            {selected.type === "warning" && (
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

// ─── Filtro de Fechas ──────────────────────────────────────────────────────────

interface FiltroFechasProps {
  desde: string;
  hasta: string;
  onDesdeChange: (v: string) => void;
  onHastaChange: (v: string) => void;
  onAplicar: () => void;
  onLimpiar: () => void;
  loading: boolean;
}

const FiltroFechas: React.FC<FiltroFechasProps> = ({
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
  onAplicar,
  onLimpiar,
  loading,
}) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
      <Calendar size={14} className="text-gray-400 shrink-0" />
      <span className="text-xs text-gray-500 font-medium">Desde</span>
      <input
        type="date"
        value={desde}
        onChange={(e) => onDesdeChange(e.target.value)}
        className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer"
      />
    </div>
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
      <Calendar size={14} className="text-gray-400 shrink-0" />
      <span className="text-xs text-gray-500 font-medium">Hasta</span>
      <input
        type="date"
        value={hasta}
        onChange={(e) => onHastaChange(e.target.value)}
        className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer"
      />
    </div>
    <Button
      variant="primary"
      onClick={onAplicar}
      disabled={loading}
      className="px-4 py-2 text-sm"
    >
      {loading ? "Cargando..." : "Aplicar"}
    </Button>
    <Button
      variant="outline"
      onClick={onLimpiar}
      disabled={loading}
      className="px-4 py-2 text-sm"
    >
      Limpiar
    </Button>
  </div>
);

// ─── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.rol === "superadmin";

  // ─── Hooks según rol
  const hookEmpresa = useDashboardEmpresa();
  const hookSucursal = useDashboardSucursal();
  const { sucursales } = useSucursalRuc(isSuperAdmin);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<number | null>(null);

  // ─── Dashboard activo según contexto ──────────────────────────────
  const { dashboard, loading, error } = useMemo(() => {
    if (isSuperAdmin && sucursalSeleccionada) return hookSucursal; // superadmin + sucursal elegida
    if (isSuperAdmin) return hookEmpresa; // superadmin sin selección
    return hookSucursal; // usuario normal
  }, [isSuperAdmin, sucursalSeleccionada, hookEmpresa, hookSucursal]);

  const [showTodasAlertas, setShowTodasAlertas] = useState(false);
  const [fecha, setFecha] = useState<string>(getFechaHoy());

  // ─── Carga inicial ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    if (isSuperAdmin) {
      // superadmin siempre carga empresa al inicio
      hookEmpresa.fetchDashboard({ ruc: user.ruc, fecha, limite: 10 });
    } else {
      // usuario normal carga su sucursal
      hookSucursal.fetchDashboard({
        sucursalId: Number(user.sucursalID),
        fecha,
        limite: 10,
      });
    }
  }, [user]);

  // ─── Cuando superadmin selecciona una sucursal ────────────────────
  useEffect(() => {
    if (!isSuperAdmin || !sucursalSeleccionada) return;
    hookSucursal.fetchDashboard({
      sucursalId: sucursalSeleccionada,
      fecha,
      limite: 10,
    });
  }, [sucursalSeleccionada]); // 👈 dispara solo cuando cambia la sucursal

  // ─── Handler de selección ──────────────────────────────────────────
  const handleSucursalChange = (id: number | null) => {
    hookSucursal.reset();
    setSucursalSeleccionada(id);
    if (id === null) {
      hookEmpresa.fetchDashboard({ ruc: user!.ruc, fecha, limite: 10 });
    }
  };

  const handleFechaChange = (nuevaFecha: string) => {
    setFecha(nuevaFecha);
    if (isSuperAdmin && sucursalSeleccionada) {
      hookSucursal.fetchDashboard({ sucursalId: sucursalSeleccionada, fecha: nuevaFecha, limite: 10 });
    } else if (isSuperAdmin) {
      hookEmpresa.fetchDashboard({ ruc: user!.ruc, fecha: nuevaFecha, limite: 10 });
    } else {
      hookSucursal.fetchDashboard({ sucursalId: Number(user!.sucursalID), fecha: nuevaFecha, limite: 10 });
    }
  };

  // ── chartData: los 7 días en base a `fecha` ──
  const chartData = useMemo(() => {
    const dias: { name: string; sales: number }[] = [];
    const base = new Date(fecha + "T00:00:00"); // evita desfase de zona horaria
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const fechaStr = d.toISOString().split("T")[0];
      const encontrado = (dashboard?.rendimientoVentas ?? []).find((r) =>
        r.fecha.startsWith(fechaStr)
      );
      dias.push({
        name: d.toLocaleDateString("es-PE", { weekday: "short", day: "2-digit" }),
        sales: encontrado ? Number(encontrado.totalVentas.toFixed(2)) : 0,
      });
    }
    return dias;
  }, [dashboard?.rendimientoVentas, fecha]);

  return (
    <>
      {showTodasAlertas && (
        <TodasAlertasModal onClose={() => setShowTodasAlertas(false)} />
      )}

      <div className="mb-4 flex items-center justify-between gap-4">
        {/* Izquierda: dropdown (solo superadmin) + input fecha (todos) */}
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <DropdownSucursal
              sucursales={sucursales}
              seleccionada={sucursalSeleccionada}
              onSelect={handleSucursalChange}
            />
          )}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 font-medium">Fecha</span>
            <input
              type="date"
              value={fecha}
              max={getFechaHoy()}
              onChange={(e) => handleFechaChange(e.target.value)}
              className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Derecha: siempre fijo */}
        <Button onClick={() => router.push("/factunet/operaciones")}>
          <Plus className="w-4 h-4" /> Nuevo Comprobante
        </Button>

      </div>

      <div className="space-y-4 animate-in fade-in duration-500 ">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 ">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-0">
                  <div className="p-3 flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </Card>
              ))
            : [
                {
                  label: "Ventas del Día",
                  value: formatMoneda(dashboard?.ventasDelDia ?? 0),
                  icon: BarChart3,
                  color: "text-brand-red",
                  bg: "bg-red-50",
                },
                {
                  label: "Facturas Emitidas",
                  value: String(dashboard?.facturasEmitidas ?? 0),
                  icon: FileText,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Boletas Emitidas",
                  value: String(dashboard?.boletasEmitidas ?? 0),
                  icon: FileText,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  label: "Notas de Crédito",
                  value: String(dashboard?.notasCreditoEmitidas ?? 0),
                  icon: FileText,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Notas de Débito",
                  value: String(dashboard?.notasDebitoEmitidas ?? 0),
                  icon: FileText,
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                },
                {
                  label: "Estado SUNAT",
                  value: "Conectado",
                  icon: Zap,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
              ].map((kpi, i) => (
                <Card key={i} className="p-0">
                  <div className="p-3 flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl shrink-0", kpi.bg)}>
                      <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider leading-tight">
                        {kpi.label}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5 truncate">
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          {loading ? (
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-50">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="h-75 w-full">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>
            </Card>
          ) : (
            <Card
              className="lg:col-span-2"
              title="Rendimiento de Ventas"
              subtitle="Resumen de los últimos 7 días"
            >
              <div className="h-75 w-full mt-4 min-h-0">
                {!dashboard || chartData.every((d) => d.sales === 0) ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Sin datos en el período seleccionado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="colorSales"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0052CC"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0052CC"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value: number | undefined) => [
                          `S/ ${(value ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
                          "Ventas",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#0052CC"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          )}

          {/* SUNAT Notifications */}
          {loading ? (
            <Card className="border-t-4 border-t-brand-red">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-50">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2 w-16 mt-1" />
                    </div>
                  </div>
                ))}
                <Skeleton className="h-10 w-full rounded-lg mt-2" />
              </div>
            </Card>
          ) : (
            <Card
              title="Notificaciones SUNAT"
              subtitle="Estado de comprobantes y alertas"
              className="border-t-4 border-t-brand-red"
            >
              <div className="space-y-4 mt-2">
                {ALL_NOTIFICACIONES.slice(0, 3).map((notif) => (
                  <div
                    key={notif.id}
                    className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                    onClick={() => setShowTodasAlertas(true)}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        notif.type === "success"
                          ? "bg-emerald-500"
                          : notif.type === "warning"
                            ? "bg-amber-500"
                            : "bg-rose-500",
                      )}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {notif.desc}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">
                        {notif.time}
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setShowTodasAlertas(true)}
                >
                  Ver todas las alertas
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Comprobantes Recientes */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-50">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3">
                      <Skeleton className="h-3 w-24" />
                    </th>
                    <th className="px-6 py-3">
                      <Skeleton className="h-3 w-32" />
                    </th>
                    <th className="px-6 py-3">
                      <Skeleton className="h-3 w-20" />
                    </th>
                    <th className="px-6 py-3">
                      <Skeleton className="h-3 w-16" />
                    </th>
                    <th className="px-6 py-3">
                      <Skeleton className="h-3 w-20" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card
            title="Comprobantes Recientes"
            action={
              <Button
                variant="ghost"
                className="text-brand-blue"
                onClick={() => router.push("/factunet/comprobantes")}
              >
                Ver todos <ChevronRight className="w-4 h-4" />
              </Button>
            }
          >
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ID Comprobante
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(dashboard?.comprobantesRecientes ?? []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-gray-400"
                      >
                        Sin comprobantes recientes
                      </td>
                    </tr>
                  ) : (
                    (dashboard?.comprobantesRecientes ?? []).map((doc, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-brand-blue">
                            {doc.numeroCompleto}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {doc.clienteRznSocial}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatFecha(doc.fechaEmision)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatMoneda(doc.importeTotal)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={estadoSunatLabel(doc.estadoSunat)}>
                            {doc.estadoSunat}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
