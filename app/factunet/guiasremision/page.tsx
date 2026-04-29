"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ChevronDown,
  RefreshCw,
  X,
  Eye,
  Check,
  Filter,
  Search,
  MoreHorizontal,
  Ban,
  Plus,
  Truck,
  CheckCircle2,
  MapPin,
  Package,
} from "lucide-react";
import { cn } from "@/app/utils/cn";
import { Card } from "@/app/components/ui/Card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/app/components/ui/Toast";
import { BtnEnvio } from "@/app/components/ui/BtnEnvio";
import { ModalDetalleGuia } from "./ModalDetalleGuia";
import { ModalEnvioGuia, GuiaEnvioData } from "./ModalEnvioGuia";
import axios from "axios";
import { createPortal } from "react-dom";

// ─── Constantes ───────────────────────────────────────────────────────────────
type TipoGuia = "remitente" | "transportista";
const TIPO_DOC: Record<TipoGuia, string> = {
  remitente: "09",
  transportista: "31",
};

const ESTADOS_OPTS = ["Todos", "Aceptado", "Pendiente", "Rechazado"];
const ESTADO_COLORS_MAP: Record<string, string> = {
  Aceptado: "bg-emerald-500",
  Pendiente: "bg-amber-400",
  Rechazado: "bg-red-500",
};

// ─── Tipo DTO (refleja la respuesta del backend) ──────────────────────────────
interface GuiaDto {
  guiaId: number;
  sucursalId?: number;
  tipoDoc: string;
  numeroCompleto?: string;
  fechaEmision: string;
  fechaCreacion: string;
  destinatarioNumDoc?: string;
  destinatarioRznSocial?: string;
  partidaDireccion?: string;
  llegadaDireccion?: string;
  transportistaRznSocial?: string;
  transportistaPlaca?: string;
  clienteCorreo?: string;
  enviadoPorCorreo: boolean;
  clienteWhatsapp?: string;
  enviadoPorWhatsapp: boolean;
  estadoSunat: string;
  codigoRespuestaSunat?: string;
  mensajeRespuestaSunat?: string;
}

// ─── Page Principal ───────────────────────────────────────────────────────────
export default function GuiasRemisionPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = user?.rol === "superadmin";
  const rucEmpresa: string = user?.ruc ?? "";
  const sucursalId: number = Number(user?.sucursalID ?? 0);

  // ── Tipo de guía activa ──
  const [tipoGuia, setTipoGuia] = useState<TipoGuia>("remitente");
  const [guiaIdDetalle, setGuiaIdDetalle] = useState<number | null>(null);
  const [modalEnvio, setModalEnvio] = useState<{
    guia: GuiaEnvioData;
    tipo: "email" | "whatsapp";
  } | null>(null);

  // ── Datos y loading ──
  const [guias, setGuias] = useState<GuiaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGuiaId, setLoadingGuiaId] = useState<number | null>(null);

  // ── Filtros locales ──
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [showAvanzado, setShowAvanzado] = useState(false);

  // ── Filtros avanzados ──
  const [modoAvanzado, setModoAvanzado] = useState<"fechas" | "unico">(
    "fechas",
  );
  const [avFechaDesde, setAvFechaDesde] = useState("");
  const [avFechaHasta, setAvFechaHasta] = useState("");
  const [avSerie, setAvSerie] = useState("");
  const [avNumero, setAvNumero] = useState("");
  const hoy = new Date().toISOString().split("T")[0];

  // ── Carga inicial por tipo ──
  const cargarGuias = useCallback(
    async (tipo: TipoGuia) => {
      if (!rucEmpresa || !accessToken) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          empresaRuc: rucEmpresa,
          tipoDoc: TIPO_DOC[tipo],
          ...(!isSuperAdmin && sucursalId
            ? { sucursalId: String(sucursalId) }
            : {}),
        });
        const { data } = await axios.get<GuiaDto[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/guias?${params}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        setGuias(data);
      } catch {
        showToast("Error al cargar las guías", "error");
      } finally {
        setLoading(false);
      }
    },
    [rucEmpresa, sucursalId, isSuperAdmin, accessToken],
  );

  useEffect(() => {
    if (!user || !accessToken) return;
    cargarGuias(tipoGuia);
  }, [user, accessToken]);

  // ── Búsqueda avanzada ──
  const buscarAvanzado = async () => {
    if (!accessToken) return;

    if (modoAvanzado === "fechas") {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          empresaRuc: rucEmpresa,
          tipoDoc: TIPO_DOC[tipoGuia],
          ...(!isSuperAdmin && sucursalId
            ? { sucursalId: String(sucursalId) }
            : {}),
          ...(avFechaDesde ? { fechaDesde: avFechaDesde } : {}),
          ...(avFechaHasta ? { fechaHasta: avFechaHasta } : {}),
        });
        const { data } = await axios.get<GuiaDto[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/guias/por-fechas?${params}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        setGuias(data);
      } catch {
        showToast("Error al buscar las guías", "error");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Guía única por serie + correlativo
    if (!avSerie || !avNumero) {
      showToast("Ingrese serie y número", "error");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get<GuiaDto>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/guias/${rucEmpresa}/${avSerie}/${avNumero}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setGuias([data]);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        showToast(
          "No se encontró ninguna guía con esa serie y número",
          "error",
        );
        setGuias([]);
      } else {
        showToast("Error al buscar la guía", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const enviarSunat = async (guiaId: number) => {
    setLoadingGuiaId(guiaId);
    try {
      const { data } = await axios.post<GuiaDto>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/guias/${guiaId}/send`,
        null,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setGuias((prev) =>
        prev.map((g) =>
          g.guiaId === guiaId
            ? {
                ...g,
                estadoSunat: data.estadoSunat,
                codigoRespuestaSunat: data.codigoRespuestaSunat,
                mensajeRespuestaSunat: data.mensajeRespuestaSunat,
              }
            : g,
        ),
      );
      if (data.estadoSunat === "ACEPTADO") {
        showToast("Guía aceptada por SUNAT", "success");
      } else {
        showToast(
          `SUNAT: ${data.mensajeRespuestaSunat ?? data.estadoSunat}`,
          "error",
        );
      }
    } catch {
      showToast("Error al enviar a SUNAT", "error");
    } finally {
      setLoadingGuiaId(null);
    }
  };

  // ── Filtrado local (search + estado) ──
  const filtered = useMemo(() => {
    return guias.filter((g) => {
      const matchSearch =
        (g.destinatarioRznSocial ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (g.destinatarioNumDoc ?? "").includes(search) ||
        (g.numeroCompleto ?? "").toLowerCase().includes(search.toLowerCase());
      const estadoLabel =
        g.estadoSunat === "ACEPTADO"
          ? "Aceptado"
          : g.estadoSunat === "RECHAZADO"
            ? "Rechazado"
            : "Pendiente";
      const matchEstado =
        filtroEstado === "Todos" || estadoLabel === filtroEstado;
      return matchSearch && matchEstado;
    });
  }, [guias, search, filtroEstado]);

  // ── Al cambiar tipo, resetear todo y recargar ──
  const cambiarTipo = (tipo: TipoGuia) => {
    setTipoGuia(tipo);
    setSearch("");
    setFiltroEstado("Todos");
    setShowAvanzado(false);
    setModoAvanzado("fechas");
    setAvFechaDesde("");
    setAvFechaHasta("");
    setAvSerie("");
    setAvNumero("");
    cargarGuias(tipo);
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {guiaIdDetalle && (
        <ModalDetalleGuia
          guiaId={guiaIdDetalle}
          accessToken={accessToken ?? ""}
          ruc={rucEmpresa}
          onClose={() => setGuiaIdDetalle(null)}
        />
      )}

      {modalEnvio && (
        <ModalEnvioGuia
          guia={modalEnvio.guia}
          tipo={modalEnvio.tipo}
          accessToken={accessToken ?? ""}
          onClose={() => setModalEnvio(null)}
        />
      )}

      <div className="sticky top-0 z-20">
        <div className="space-y-3">
          {/* ── Switch tipo de guía ── */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
            <button
              onClick={() => cambiarTipo("remitente")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                tipoGuia === "remitente"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <Package size={14} />
              Guía Remitente
            </button>
            <button
              onClick={() => cambiarTipo("transportista")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                tipoGuia === "transportista"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <Truck size={14} />
              Guía Transportista
            </button>
          </div>

          {/* ── Barra de filtros + botón nuevo ── */}
          <div className="flex items-start justify-between gap-2">
            {/* Buscar + Filtros */}
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto sm:flex-1 min-w-48 max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    tipoGuia === "remitente"
                      ? "Buscar por destinatario, RUC/DNI o N° guía..."
                      : "Buscar por remitente, RUC/DNI o N° guía..."
                  }
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <DropdownFiltro
                label="Estado SUNAT"
                value={filtroEstado}
                options={ESTADOS_OPTS}
                onChange={(v) => setFiltroEstado(v)}
                colorMap={ESTADO_COLORS_MAP}
              />

              <button
                onClick={() => setShowAvanzado((o) => !o)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm font-medium border rounded-xl transition-all shadow-sm",
                  showAvanzado
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                )}
              >
                <Filter size={14} /> Opciones avanzadas
                <ChevronDown
                  size={13}
                  className={cn(
                    "transition-transform",
                    showAvanzado && "rotate-180",
                  )}
                />
              </button>

              {filtroEstado !== "Todos" && (
                <button
                  onClick={() => setFiltroEstado("Todos")}
                  className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Botón nueva guía */}
            <div className="shrink-0">
              <button
                onClick={() =>
                  router.push("/factunet/operaciones/guia-remision")
                }
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
              >
                <Plus size={14} /> Nueva Guía
              </button>
            </div>
          </div>

          {/* ── Panel avanzado ── */}
          {showAvanzado && (
            <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {/* Tabs de modo */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
                {(
                  [
                    { key: "fechas", label: "Por fechas" },
                    { key: "unico", label: "Guía única" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setModoAvanzado(tab.key);
                      setAvFechaDesde("");
                      setAvFechaHasta("");
                      setAvSerie("");
                      setAvNumero("");
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                      modoAvanzado === tab.key
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Campos según modo */}
              <div className="flex flex-wrap items-end gap-3">
                {modoAvanzado === "fechas" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Fecha desde
                      </label>
                      <input
                        type="date"
                        value={avFechaDesde}
                        max={hoy}
                        onChange={(e) => {
                          setAvFechaDesde(e.target.value);
                          if (avFechaHasta && e.target.value > avFechaHasta)
                            setAvFechaHasta("");
                        }}
                        className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Fecha hasta
                      </label>
                      <input
                        type="date"
                        value={avFechaHasta}
                        min={avFechaDesde || undefined}
                        max={hoy}
                        onChange={(e) => setAvFechaHasta(e.target.value)}
                        className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  </>
                )}

                {modoAvanzado === "unico" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Serie
                      </label>
                      <input
                        value={avSerie}
                        onChange={(e) =>
                          setAvSerie(e.target.value.toUpperCase())
                        }
                        placeholder="T001"
                        className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-28"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Número
                      </label>
                      <input
                        type="number"
                        value={avNumero}
                        onChange={(e) => setAvNumero(e.target.value)}
                        placeholder="1"
                        className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-28"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={buscarAvanzado}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors self-end"
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Search size={14} />
                  )}{" "}
                  Buscar
                </button>
                <button
                  onClick={() => {
                    setAvFechaDesde("");
                    setAvFechaHasta("");
                    setAvSerie("");
                    setAvNumero("");
                    cargarGuias(tipoGuia);
                  }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors self-end pb-2"
                >
                  <X size={12} /> Limpiar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Contador ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Total{" "}
          <span className="font-semibold text-gray-900">{guias.length}</span>{" "}
          guías de{" "}
          {tipoGuia === "remitente"
            ? "remisión (remitente)"
            : "remisión (transportista)"}
        </p>
        {(!!search || filtroEstado !== "Todos") &&
          filtered.length === 0 &&
          !loading && (
            <p className="text-sm text-amber-600 font-medium">
              Sin resultados para esta búsqueda
            </p>
          )}
      </div>

      {/* ── Tabla ── */}
      <style>
        {` .guia-table-wrapper {
            overflow-y: auto;
            max-height: calc(100vh - 330px);
            scrollbar-width: thin;
            scrollbar-color: #CBD5E1 transparent;
          }
          .guia-table-wrapper-avanzado {
            max-height: calc(100vh - 420px);
          }`}
      </style>

      <Card className="p-0 rounded-2xl border border-gray-200 overflow-hidden">
  <div className={cn("guia-table-wrapper", showAvanzado && "guia-table-wrapper-avanzado")}>
          {tipoGuia === "remitente" ? (
            <TablaRemitente
              guias={filtered}
              loading={loading}
              showAvanzado={showAvanzado}
              onVerDetalle={setGuiaIdDetalle}
              onEnvio={(g, tipo) => setModalEnvio({ guia: g, tipo })}
              onEnviarSunat={enviarSunat}
              loadingGuiaId={loadingGuiaId}
              onEditar={(guiaId) =>
                router.push(
                  `/factunet/operaciones/guia-remision?editarGuiaId=${guiaId}`,
                )
              }
            />
          ) : (
            <TablaTransportista
              guias={filtered}
              loading={loading}
              showAvanzado={showAvanzado}
              onVerDetalle={setGuiaIdDetalle}
              onEnvio={(g, tipo) => setModalEnvio({ guia: g, tipo })}
              onEnviarSunat={enviarSunat}
              loadingGuiaId={loadingGuiaId}
              onEditar={(guiaId) =>
                router.push(
                  `/factunet/operaciones/guia-remision?editarGuiaId=${guiaId}`,
                )
              }
            />
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Helper fecha ─────────────────────────────────────────────────────────────
const fmtFecha = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

// ─── Tabla Remitente ──────────────────────────────────────────────────────────
function TablaRemitente({
  guias,
  loading,
  showAvanzado,
  onVerDetalle,
  onEnvio,
  onEnviarSunat,
  loadingGuiaId,
  onEditar,
}: {
  guias: GuiaDto[];
  loading: boolean;
  showAvanzado: boolean;
  onVerDetalle: (id: number) => void;
  onEnvio: (guia: GuiaDto, tipo: "email" | "whatsapp") => void;
  onEnviarSunat: (guiaId: number) => void;
  loadingGuiaId: number | null;
  onEditar: (guiaId: number) => void;
}) {
  return (
    <table className={cn("w-full text-left border-collapse", showAvanzado)}>
      <thead className="sticky top-0 z-10">
        <tr className="bg-gray-100">
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-tl-2xl">
            FECHA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            N° GUÍA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            DESTINATARIO
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            PUNTO PARTIDA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            PUNTO LLEGADA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            TRANSPORTISTA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
            CORREO
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
            WHATSAPP
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
            SUNAT
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
            VER
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center rounded-tr-2xl">
            OPCIONES
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {loading ? (
          <tr>
            <td colSpan={9} className="px-6 py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={24} className="animate-spin text-blue-400" />
                <span className="text-sm text-gray-400">Cargando guías...</span>
              </div>
            </td>
          </tr>
        ) : guias.length === 0 ? (
          <tr>
            <td
              colSpan={9}
              className="px-6 py-16 text-center text-sm text-gray-400"
            >
              No se encontraron guías con ese criterio.
            </td>
          </tr>
        ) : (
          guias.map((g) => (
            <tr
              key={g.guiaId}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <td className="px-5 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                {fmtFecha(g.fechaEmision)}
              </td>
              <td className="px-5 py-4 text-sm text-gray-800 whitespace-nowrap">
                {g.numeroCompleto}
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {g.destinatarioNumDoc}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-44">
                    {g.destinatarioRznSocial}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="text-xs text-gray-600 flex items-start gap-1">
                  <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">
                    {g.partidaDireccion ?? "—"}
                  </span>
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="text-xs text-gray-600 flex items-start gap-1">
                  <MapPin size={12} className="text-blue-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">
                    {g.llegadaDireccion ?? "—"}
                  </span>
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <Truck size={12} className="text-gray-400 shrink-0" />
                  <span className="truncate max-w-36">
                    {g.transportistaRznSocial ?? "—"}
                  </span>
                </span>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex justify-center">
                  <BtnEnvio
                    tipo="email"
                    enviado={g.enviadoPorCorreo}
                    onClick={() => onEnvio(g, "email")}
                  />
                </div>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex justify-center">
                  <BtnEnvio
                    tipo="whatsapp"
                    enviado={g.enviadoPorWhatsapp}
                    onClick={() => onEnvio(g, "whatsapp")}
                  />
                </div>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex justify-center">
                  {loadingGuiaId === g.guiaId ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold bg-blue-50 text-blue-600 border-blue-200 whitespace-nowrap">
                      <RefreshCw size={11} className="animate-spin" />{" "}
                      Enviando...
                    </span>
                  ) : (
                    <BadgeSunat estado={g.estadoSunat} />
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-center">
                <button
                  onClick={() => onVerDetalle(g.guiaId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Eye size={13} /> Ver
                </button>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex justify-center">
                  <DropdownOpcionesGuia
                    estado={g.estadoSunat}
                    onEnviarSunat={() => onEnviarSunat(g.guiaId)}
                    onEditar={() => onEditar(g.guiaId)}
                  />
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── Tabla Transportista ──────────────────────────────────────────────────────
function TablaTransportista({
  guias,
  loading,
  showAvanzado,
  onVerDetalle,
  onEnvio,
  onEnviarSunat,
  loadingGuiaId,
  onEditar,
}: {
  guias: GuiaDto[];
  loading: boolean;
  showAvanzado: boolean;
  onVerDetalle: (id: number) => void;
  onEnvio: (guia: GuiaDto, tipo: "email" | "whatsapp") => void;
  onEnviarSunat: (guiaId: number) => void;
  loadingGuiaId: number | null;
  onEditar: (guiaId: number) => void;
}) {
  return (
    <table className={cn("w-full text-left border-collapse", showAvanzado)}>
      <thead className="sticky top-0 z-10">
        <tr className="bg-gray-100">
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-tl-2xl">
            FECHA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            N° GUÍA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            DESTINATARIO
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            PUNTO PARTIDA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            PUNTO LLEGADA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            PLACA
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
            CORREO
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
            WHATSAPP
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
            SUNAT
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
            VER
          </th>
          <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center rounded-tl-2xl">
            OPCIONES
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {loading ? (
          <tr>
            <td colSpan={9} className="px-6 py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={24} className="animate-spin text-blue-400" />
                <span className="text-sm text-gray-400">Cargando guías...</span>
              </div>
            </td>
          </tr>
        ) : guias.length === 0 ? (
          <tr>
            <td
              colSpan={9}
              className="px-6 py-16 text-center text-sm text-gray-400"
            >
              No se encontraron guías con ese criterio.
            </td>
          </tr>
        ) : (
          guias.map((g) => (
            <tr
              key={g.guiaId}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <td className="px-5 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                {fmtFecha(g.fechaEmision)}
              </td>
              <td className="px-5 py-4 text-sm text-gray-800 whitespace-nowrap">
                {g.numeroCompleto}
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {g.destinatarioNumDoc}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-44">
                    {g.destinatarioRznSocial}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="text-xs text-gray-600 flex items-start gap-1">
                  <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">
                    {g.partidaDireccion ?? "—"}
                  </span>
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="text-xs text-gray-600 flex items-start gap-1">
                  <MapPin size={12} className="text-blue-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">
                    {g.llegadaDireccion ?? "—"}
                  </span>
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs font-mono font-semibold text-gray-700">
                  <Truck size={11} className="text-gray-500" />
                  {g.transportistaPlaca ?? "—"}
                </span>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex justify-center">
                  <BtnEnvio
                    tipo="email"
                    enviado={g.enviadoPorCorreo}
                    onClick={() => onEnvio(g, "email")}
                  />
                </div>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex justify-center">
                  <BtnEnvio
                    tipo="whatsapp"
                    enviado={g.enviadoPorWhatsapp}
                    onClick={() => onEnvio(g, "whatsapp")}
                  />
                </div>
              </td>
              <td className="px-5 py-4 text-center">
                <div className="flex justify-center">
                  {loadingGuiaId === g.guiaId ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold bg-blue-50 text-blue-600 border-blue-200 whitespace-nowrap">
                      <RefreshCw size={11} className="animate-spin" />{" "}
                      Enviando...
                    </span>
                  ) : (
                    <BadgeSunat estado={g.estadoSunat} />
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-center">
                <button
                  onClick={() => onVerDetalle(g.guiaId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Eye size={13} /> Ver
                </button>
              </td>
              <td className="px-5 py-4 text-center ">
                <div className="flex justify-center">
                  <DropdownOpcionesGuia
                    estado={g.estadoSunat}
                    onEnviarSunat={() => onEnviarSunat(g.guiaId)}
                    onEditar={() => onEditar(g.guiaId)}
                  />
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── BadgeSunat ───────────────────────────────────────────────────────────────
const SUNAT_CFG: Record<string, { badge: string }> = {
  ACEPTADO: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDIENTE: { badge: "bg-amber-50 text-amber-700 border-amber-200" },
  RECHAZADO: { badge: "bg-red-50 text-red-700 border-red-200" },
};

const BadgeSunat = ({ estado }: { estado: string }) => {
  const cfg = SUNAT_CFG[estado] ?? SUNAT_CFG.PENDIENTE;
  const icon =
    estado === "ACEPTADO" ? (
      <CheckCircle2 size={11} />
    ) : estado === "RECHAZADO" ? (
      <X size={11} />
    ) : (
      <RefreshCw size={11} />
    );
  const label =
    estado === "ACEPTADO"
      ? "Aceptado"
      : estado === "RECHAZADO"
        ? "Rechazado"
        : "Pendiente";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap",
        cfg.badge,
      )}
    >
      {icon} {label}
    </span>
  );
};

// ─── DropdownFiltro ───────────────────────────────────────────────────────────
interface DropdownFiltroProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
}

const DropdownFiltro = ({
  label,
  value,
  options,
  onChange,
  colorMap,
}: DropdownFiltroProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const active = value !== "Todos";
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 pl-3 pr-2.5 py-2 text-sm font-medium border rounded-lg outline-none transition-all shadow-sm whitespace-nowrap",
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
        )}
      >
        {active ? value : label}
        {active ? (
          <X
            size={13}
            className="text-white/80"
            onClick={(e) => {
              e.stopPropagation();
              onChange("Todos");
            }}
          />
        ) : (
          <ChevronDown
            size={14}
            className={cn("transition-transform", open && "rotate-180")}
          />
        )}
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-44">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors text-left",
                value === opt
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <span className="flex items-center gap-2">
                {colorMap && opt !== "Todos" && (
                  <span className={cn("w-2 h-2 rounded-full", colorMap[opt])} />
                )}
                {opt}
              </span>
              {value === opt && (
                <Check size={13} className="text-blue-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── DropdownOpciones Guía ────────────────────────────────────────────────────
const DropdownOpcionesGuia = ({
  estado,
  onEnviarSunat,
  onEditar,
}: {
  estado: string;
  onEnviarSunat: () => void;
  onEditar: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const esAceptado = estado === "ACEPTADO";
  const esPendiente = estado === "PENDIENTE";
  const esRechazado = estado === "RECHAZADO";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
      >
        <MoreHorizontal size={16} />
      </button>
      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: pos.top,
              right: pos.right,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-48"
          >
            {esPendiente && (
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onEnviarSunat();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={14} className="text-blue-500" /> Enviar a SUNAT
              </button>
            )}
            {esRechazado && (
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onEditar();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={14} className="text-amber-500" /> Editar y
                reenviar
              </button>
            )}
            {esAceptado && (
              <>
                <div className="border-t border-gray-100" />
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors text-red-600 hover:bg-red-50"
                >
                  <Ban size={14} className="text-red-500" /> Anular
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};
