"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Zap, WifiOff, AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { cn } from "@/app/utils/cn";
import { ApisSunat } from "@/app/utils/ApisSunat";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PingRecord {
  connected: boolean;
  ms: number;
}

interface ConnectionStatus {
  connected: boolean;
  responseMs: number;
}

interface EstadoConexionSunatCardProps {
  className?: string;
  refreshIntervalMs?: number;
}

// ─── Umbrales ─────────────────────────────────────────────────────────────────
const THRESHOLD_FAST = 800;
const THRESHOLD_SLOW = 2000;
const MAX_HISTORY = 20;

// ─── Estados ──────────────────────────────────────────────────────────────────
type ServiceState = "operativo" | "lento" | "critico" | "caido";

function getServiceState(connected: boolean, responseMs: number): ServiceState {
  if (!connected) return "caido";
  if (responseMs < THRESHOLD_FAST) return "operativo";
  if (responseMs < THRESHOLD_SLOW) return "lento";
  return "critico";
}

const STATE_CONFIG: Record<
  ServiceState,
  {
    banner: string;
    border: string;
    iconBg: string;
    iconShadow: string;
    titleColor: string;
    textColor: string;
    title: string;
    icon: React.ElementType;
    description: (ms: number) => string;
  }
> = {
  operativo: {
    banner: "bg-emerald-50",
    border: "border-emerald-100",
    iconBg: "bg-emerald-500",
    iconShadow: "shadow-emerald-200",
    titleColor: "text-emerald-900",
    textColor: "text-emerald-700",
    title: "Servicio Operativo",
    icon: Zap,
    description: (ms) =>
      `SUNAT respondió correctamente. Tiempo de respuesta: ${ms}ms.`,
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
    description: (ms) =>
      `SUNAT responde con demora: ${ms}ms. El envío puede tardar más de lo normal.`,
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
    description: (ms) =>
      `Tiempo de respuesta muy alto: ${ms}ms. SUNAT puede estar con alta carga.`,
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
    description: () =>
      "No se pudo conectar con los servidores de SUNAT. Verifica tu conexión.",
  },
};

// ─── Barra de velocidad ───────────────────────────────────────────────────────
function ResponseBar({
  responseMs,
  state,
}: {
  responseMs: number;
  state: ServiceState;
}) {
  if (state === "caido") return null;
  const pct = Math.min((responseMs / 2000) * 100, 100);
  const barColor =
    state === "operativo"
      ? "bg-emerald-500"
      : state === "lento"
      ? "bg-amber-500"
      : "bg-orange-500";

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Velocidad de respuesta</span>
        <span className="font-medium">{responseMs}ms</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            barColor
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>Rápido &lt;800ms</span>
        <span>Lento &lt;2000ms</span>
        <span>Crítico</span>
      </div>
    </div>
  );
}

// ─── Métricas inferiores ──────────────────────────────────────────────────────
function MetricsRow({
  records,
}: {
  records: PingRecord[];
}) {
  const validMs = records.filter((r) => r.connected).map((r) => r.ms);
  const avgMs =
    validMs.length > 0
      ? Math.round(validMs.reduce((a, b) => a + b, 0) / validMs.length)
      : null;

  const uptimePct =
    records.length > 0
      ? ((records.filter((r) => r.connected).length / records.length) * 100).toFixed(1)
      : null;

  const uptimeNum = uptimePct ? parseFloat(uptimePct) : 100;
  const uptimeBarColor =
    uptimeNum >= 95
      ? "bg-emerald-500"
      : uptimeNum >= 80
      ? "bg-amber-500"
      : "bg-red-500";

  const avgColor =
    avgMs === null
      ? "text-gray-400"
      : avgMs < THRESHOLD_FAST
      ? "text-emerald-600"
      : avgMs < THRESHOLD_SLOW
      ? "text-amber-600"
      : "text-orange-600";

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {/* Uptime */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
        <p className="text-[11px] text-gray-400 mb-1">Uptime estimado</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold text-gray-800">
            {uptimePct !== null ? `${uptimePct}%` : "—"}
          </span>
          <span className="text-[10px] text-gray-400">últimas 24h</span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              uptimeBarColor
            )}
            style={{ width: `${uptimePct ?? 0}%` }}
          />
        </div>
      </div>

      {/* Latencia promedio */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
        <p className="text-[11px] text-gray-400 mb-1">Latencia promedio</p>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-xl font-semibold", avgColor)}>
            {avgMs !== null ? avgMs : "—"}
          </span>
          {avgMs !== null && (
            <span className="text-[10px] text-gray-400">ms</span>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          {validMs.length > 0
            ? `De ${validMs.length} verificación${validMs.length > 1 ? "es" : ""}`
            : "Calculando..."}
        </p>
      </div>
    </div>
  );
}


// ─── Component principal ──────────────────────────────────────────────────────
export function EstadoConexionSunatCard({
  className,
  refreshIntervalMs = 60_000,
}: EstadoConexionSunatCardProps) {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    responseMs: 0,
  });
  const [pingHistory, setPingHistory] = useState<PingRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (!initialLoading) setRefreshing(true);

    const start = Date.now();
    let connected = false;
    let responseMs = 0;

    try {
      const res = await fetch(ApisSunat.checkConnection, {
        method: "GET",
        signal: AbortSignal.timeout(8000),
      });
      const elapsed = Date.now() - start;
      const data: { alive: boolean; sunatMs: number } = await res.json();
      connected = data.alive;
      responseMs = data.sunatMs ?? elapsed;
    } catch {
      connected = false;
      responseMs = 0;
    }

    const record: PingRecord = {
      connected,
      ms: responseMs,
    };

    setStatus({ connected, responseMs });
    setPingHistory((prev) => {
      const next = [...prev, record];
      return next.length > MAX_HISTORY
        ? next.slice(next.length - MAX_HISTORY)
        : next;
    });
    setLastChecked(new Date());
    setInitialLoading(false);
    setRefreshing(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkConnection();
    const id = setInterval(() => checkConnection(), refreshIntervalMs);
    return () => clearInterval(id);
  }, [checkConnection, refreshIntervalMs]);

  const state = getServiceState(status.connected, status.responseMs);
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <Card
        className={className}
        title="Estado de Conexión SUNAT"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-28 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
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
  
    >
      {/* Banner principal */}
      <div
        className={cn(
          "flex items-start gap-5 p-3 rounded-2xl border transition-colors duration-500",
          cfg.banner,
          cfg.border
        )}
      >
        <div
          className={cn(
            "p-3 rounded-full text-white shadow-lg shrink-0 transition-colors duration-500",
            cfg.iconBg,
            cfg.iconShadow
          )}
        >
          <Icon className="w-7 h-7" />
        </div>

        <div className="flex-1 space-y-0 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={cn(
                "text-[15px] font-semibold transition-colors duration-500",
                cfg.titleColor
              )}
            >
              {cfg.title}
            </h4>
            <button
              onClick={() => checkConnection(true)}
              disabled={refreshing}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors shrink-0"
              title="Verificar ahora"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 transition-transform",
                  refreshing && "animate-spin"
                )}
              />
            </button>
          </div>

          <p
            className={cn(
              "text-[12px] leading-snug transition-colors duration-500",
              cfg.textColor
            )}
          >
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

      {/* Métricas: uptime + latencia promedio */}
      <MetricsRow records={pingHistory} />

      {/* Badge de ambiente */}
    </Card>
  );
}