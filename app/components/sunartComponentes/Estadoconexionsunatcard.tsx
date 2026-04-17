"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Zap, WifiOff, AlertTriangle, CheckCircle2, FileJson, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { cn } from "@/app/utils/cn";
import { ApisSunat } from "@/app/utils/ApisSunat";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConnectionStatus {
  connected: boolean;
  responseMs: number;
  cdrCount: number;
  xmlCount: number;
  errors: number;
}

interface EstadoConexionSunatCardProps {
  cdrCount?: number;
  xmlCount?: number;
  errors?: number;
  className?: string;
  refreshIntervalMs?: number;
}

// ─── Umbrales ─────────────────────────────────────────────────────────────────
const THRESHOLD_FAST = 800;
const THRESHOLD_SLOW = 2000;

// ─── Estados ──────────────────────────────────────────────────────────────────
type ServiceState = "operativo" | "lento" | "critico" | "caido";

function getServiceState(connected: boolean, responseMs: number): ServiceState {
  if (!connected) return "caido";
  if (responseMs < THRESHOLD_FAST) return "operativo";
  if (responseMs < THRESHOLD_SLOW) return "lento";
  return "critico";
}

const STATE_CONFIG: Record<ServiceState, {
  banner: string;
  border: string;
  iconBg: string;
  iconShadow: string;
  titleColor: string;
  textColor: string;
  title: string;
  icon: React.ElementType;
  description: (ms: number) => string;
}> = {
  operativo: {
    banner: "bg-emerald-50",
    border: "border-emerald-100",
    iconBg: "bg-emerald-500",
    iconShadow: "shadow-emerald-200",
    titleColor: "text-emerald-900",
    textColor: "text-emerald-700",
    title: "Servicio Operativo",
    icon: Zap,
    description: (ms) => `SUNAT respondió correctamente. Tiempo de respuesta: ${ms}ms.`,
  },
  lento: {
    banner: "bg-amber-50",
    border: "border-amber-100",
    iconBg: "bg-amber-500",
    iconShadow: "shadow-amber-200",
    titleColor: "text-amber-900",
    textColor: "text-amber-700",
    title: "Servicio Lento",
    icon: AlertTriangle,
    description: (ms) => `SUNAT responde con demora: ${ms}ms. El envío puede tardar más de lo normal.`,
  },
  critico: {
    banner: "bg-orange-50",
    border: "border-orange-100",
    iconBg: "bg-orange-500",
    iconShadow: "shadow-orange-200",
    titleColor: "text-orange-900",
    textColor: "text-orange-700",
    title: "Servicio Crítico",
    icon: AlertTriangle,
    description: (ms) => `Tiempo de respuesta muy alto: ${ms}ms. SUNAT puede estar con alta carga.`,
  },
  caido: {
    banner: "bg-red-50",
    border: "border-red-100",
    iconBg: "bg-red-500",
    iconShadow: "shadow-red-200",
    titleColor: "text-red-900",
    textColor: "text-red-700",
    title: "Sin Conexión",
    icon: WifiOff,
    description: () => "No se pudo conectar con los servidores de SUNAT. Verifica tu conexión.",
  },
};

// ─── Barra de velocidad ───────────────────────────────────────────────────────
function ResponseBar({ responseMs, state }: { responseMs: number; state: ServiceState }) {
  if (state === "caido") return null;
  const pct = Math.min((responseMs / 2000) * 100, 100);
  const barColor =
    state === "operativo" ? "bg-emerald-500" :
    state === "lento"     ? "bg-amber-500"   : "bg-orange-500";

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Velocidad de respuesta</span>
        <span className="font-medium">{responseMs}ms</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-300">
        <span>Rápido &lt;800ms</span>
        <span>Lento &lt;2000ms</span>
        <span>Crítico</span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EstadoConexionSunatCard({
  cdrCount = 0,
  xmlCount = 0,
  errors = 0,
  className,
  refreshIntervalMs = 60_000,
}: EstadoConexionSunatCardProps) {

  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    responseMs: 0,
    cdrCount,
    xmlCount,
    errors,
  });

  // initialLoading → solo true la primera vez, muestra skeleton completo
  // refreshing     → true en cada refresco silencioso, solo mueve el ícono de refresh
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async (isManual = false) => {
    // Si ya tenemos datos previos, es refresco silencioso → no toca initialLoading
    if (initialLoading || isManual) {
      if (isManual) setRefreshing(true);
    } else {
      // refresco automático del intervalo → silencioso
      setRefreshing(true);
    }

    const start = Date.now();
    try {
      const res = await fetch(ApisSunat.checkConnection, {
        method: "GET",
        signal: AbortSignal.timeout(8000),
      });

      const responseMs = Date.now() - start;
      const data: { alive: boolean; sunatMs: number } = await res.json();

      // Actualiza solo los valores, el layout no cambia
      setStatus((prev) => ({
        ...prev,
        connected: data.alive,
        responseMs: data.sunatMs ?? responseMs,
      }));
    } catch {
      setStatus((prev) => ({ ...prev, connected: false, responseMs: 0 }));
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      setLastChecked(new Date());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkConnection();
    const id = setInterval(() => checkConnection(), refreshIntervalMs);
    return () => clearInterval(id);
  }, [checkConnection, refreshIntervalMs]);

  const state = getServiceState(status.connected, status.responseMs);
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;

  const stats = [
    { label: "CDR Recibidos", value: status.cdrCount.toLocaleString(), icon: CheckCircle2, color: "text-emerald-600" },
    { label: "XML Generados", value: status.xmlCount.toLocaleString(),  icon: FileJson,    color: "text-blue-600"   },
    { label: "Errores Envío", value: status.errors.toString(),          icon: AlertCircle, color: status.errors > 0 ? "text-red-500" : "text-gray-400" },
  ];

  // ── Skeleton solo en la carga inicial ────────────────────────────────────
  if (initialLoading) {
    return (
      <Card className={className} title="Estado de Conexión SUNAT" subtitle="Medido contra ambiente Beta SUNAT">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={className}
      title="Estado de Conexión SUNAT"
      subtitle="Medido contra ambiente Beta SUNAT"
    >
      <div className={cn("flex items-start gap-5 p-4 rounded-2xl border transition-colors duration-500", cfg.banner, cfg.border)}>
        <div className={cn("p-4 rounded-full text-white shadow-lg shrink-0 transition-colors duration-500", cfg.iconBg, cfg.iconShadow)}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className={cn("text-lg font-bold transition-colors duration-500", cfg.titleColor)}>
              {cfg.title}
            </h4>
            {/* Solo este ícono pequeño gira durante el refresco silencioso */}
            <button
              onClick={() => checkConnection(true)}
              disabled={refreshing}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
              title="Verificar ahora"
            >
              <RefreshCw className={cn("w-4 h-4 transition-transform", refreshing && "animate-spin")} />
            </button>
          </div>
          <p className={cn("text-sm leading-snug transition-colors duration-500", cfg.textColor)}>
            {cfg.description(status.responseMs)}
          </p>
          {lastChecked && (
            <p className="text-[11px] text-gray-400">
              Última verificación: {lastChecked.toLocaleTimeString("es-PE")}
            </p>
          )}
          <ResponseBar responseMs={status.responseMs} state={state} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <stat.icon className={cn("w-5 h-5 mb-2", stat.color)} />
            <p className="text-xs font-bold text-gray-500 uppercase">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}