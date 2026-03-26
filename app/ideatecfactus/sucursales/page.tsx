"use client";
import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  FileText,
  Loader2,
  Building2,
  CheckCircle2,
  XCircle,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/app/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

import {
  EditSucursalForm,
  NuevaSucursalForm,
  Sucursal,
} from "@/app/components/modalSucursales/types";
import { NuevaSucursalModal } from "@/app/components/modalSucursales/Nuevasucursalmodal";
import { EditarSucursalModal } from "@/app/components/modalSucursales/Editarsucursalmodal";
import { SeriesSucursalModal } from "@/app/components/modalSucursales/Seriessucursalmodal";
import { EliminarModal } from "@/app/components/modalSucursales/Eliminarsucursalmodal";

// ─── Helper ───────────────────────────────────────────────────────────────────
function nextCodigo(sucursales: Sucursal[]): string {
  const nums = sucursales.map((s) => parseInt(s.codigo));
  const max = nums.length ? Math.max(...nums) : -1;
  return String(max + 1).padStart(4, "0");
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "slate";
}

const colorMap = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-500",
  },
  amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500" },
  slate: { bg: "bg-slate-50", text: "text-slate-700", icon: "text-slate-500" },
};

function StatCard({ label, value, icon, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0 ${c.icon}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SucursalesPage() {
  const { showToast } = useToast();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);

  // Estado local de habilitado/inhabilitado por id (true = habilitado)
  // TODO: inicializar desde API cuando esté disponible
  const [estadoSucursales, setEstadoSucursales] = useState<
    Record<string, boolean>
  >({});

  const [modalNueva, setModalNueva] = useState(false);
  const [modalEditar, setModalEditar] = useState<Sucursal | null>(null);
  const [modalSeries, setModalSeries] = useState<Sucursal | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Sucursal | null>(null);

  const { accessToken, user } = useAuth();

  useEffect(() => {
    console.log("🔍 Contexto usuario:", user);
    console.log("🔑 Access Token:", accessToken ? "presente" : "ausente");
  }, [user, accessToken]);

  const [loading, setLoading] = useState(true);

  const isSuperadmin = user?.rol === "superadmin";

  const visibleSucursales = isSuperadmin ? sucursales : sucursales.slice(0, 1);

  const filtered = visibleSucursales.filter(
    (s) =>
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.codigo.includes(search),
  );
  const displayed = filtered.slice(0, pageSize);

  const totalSeries = sucursales.reduce((acc, s) => {
    let count = 0;
    if (s.serieFactura) count++;
    if (s.serieBoleta) count++;
    if (s.serieNotaCredito) count++;
    if (s.serieNotaDebito) count++;
    if (s.serieGuia) count++;
    return acc + count;
  }, 0);

  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal`,
        {
          params: {
            ruc: user?.ruc,
            sucursalID: user?.rol === "superadmin" ? null : user?.sucursalID,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = res.data.map((s: any) => ({
        id: s.sucursalId.toString(),
        codigo: s.codEstablecimiento,
        nombre: s.nombre ?? s.codEstablecimiento,
        direccion: s.direccion ?? "",
        usuario: "",
        serieFactura: s.serieFactura,
        correlativoFactura: s.correlativoFactura ?? 1,
        serieBoleta: s.serieBoleta,
        correlativoBoleta: s.correlativoBoleta ?? 1,
        serieNotaCredito: s.serieNotaCredito,
        correlativoNotaCredito: s.correlativoNotaCredito ?? 1,
        serieNotaDebito: s.serieNotaDebito,
        correlativoNotaDebito: s.correlativoNotaDebito ?? 1,
        serieGuia: s.serieGuiaRemision,
        correlativoGuia: s.correlativoGuiaRemision ?? 1,
      }));
      setSucursales(data);
      // Inicializar todas como habilitadas si aún no tienen estado guardado
      setEstadoSucursales((prev) => {
        const next = { ...prev };
        data.forEach((s: Sucursal) => {
          if (!(s.id in next)) next[s.id] = true;
        });
        return next;
      });
    } catch {
      6;
      showToast("Error al cargar sucursales", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchSucursales();
  }, [accessToken]);

  const handleCrear = async (form: NuevaSucursalForm) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal`,
        {
          codEstablecimiento: nextCodigo(sucursales),
          nombre: form.nombre,
          direccion: form.direccion,
          nombreSucursal: form.nombre,
          serieFactura: form.serieFactura,
          correlativoFactura: form.correlativoFactura,
          serieBoleta: form.serieBoleta,
          correlativoBoleta: form.correlativoBoleta,
          serieNotaCredito: form.serieNotaCredito,
          correlativoNotaCredito: form.correlativoNotaCredito,
          serieNotaDebito: form.serieNotaDebito,
          correlativoNotaDebito: form.correlativoNotaDebito,
          serieGuiaRemision: form.serieGuia,
          correlativoGuiaRemision: form.correlativoGuia,
          serieGuiaTransportista: "V001",
          correlativoGuiaTransportista: 1,
          usernameAdminSucursal: form.usuario,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalNueva(false);
      showToast(`Sucursal "${form.nombre}" creada correctamente`, "success");
      fetchSucursales();
    } catch (error: any) {
      showToast(
        error.response?.data?.mensaje || "Error al crear sucursal",
        "error",
      );
    }
  };

  const handleEditarSeries = async (id: string, data: any) => {
    const sucursalId = isSuperadmin ? id : user?.sucursalID;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${sucursalId}`,
        {
          ...data,
          sucursalId: user?.sucursalID,
          nombre: modalSeries?.nombre,
          direccion: modalSeries?.direccion,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalSeries(null);
      showToast("Series actualizadas correctamente", "success");
      fetchSucursales();
    } catch (error: any) {
      showToast(
        error.response?.data?.mensaje || "Error al actualizar series",
        "error",
      );
    }
  };

  const handleEditar = async (id: string, data: EditSucursalForm) => {
    const sucursalId = isSuperadmin ? id : user?.sucursalID;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${sucursalId}`,
        { nombre: data.nombre, direccion: data.direccion },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalEditar(null);
      showToast("Sucursal actualizada correctamente", "success");
      fetchSucursales();
    } catch (error: any) {
      showToast(
        error.response?.data?.mensaje || "Error al actualizar sucursal",
        "error",
      );
    }
  };

  const handleEliminar = async (id: string) => {
    const s = sucursales.find((x) => x.id === id);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalEliminar(null);
      showToast(`Sucursal "${s?.nombre}" eliminada`, "error");
      fetchSucursales();
    } catch (error: any) {
      showToast(
        error.response?.data?.mensaje || "Error al eliminar sucursal",
        "error",
      );
    }
  };

  // TODO: reemplazar con llamada a la API cuando esté lista
  const handleToggleEstado = (id: string) => {
    setEstadoSucursales((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div />
        <button
          type="button"
          onClick={() => setModalNueva(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-sm shadow-blue-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {/* ── Stats (solo superadmin) ── */}
      {isSuperadmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total sucursales"
            value={sucursales.length}
            icon={<Building2 className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Activas"
            value={sucursales.length}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Inactivas"
            value={0}
            icon={<XCircle className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            label="Series registradas"
            value={totalSeries}
            icon={<BookOpen className="w-5 h-5" />}
            color="slate"
          />
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-gray-50 transition-colors placeholder:text-gray-400"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto">
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors text-gray-700 cursor-pointer"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["CÓDIGO", "NOMBRE", "DIRECCIÓN", "ACCIONES"].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide ${
                      h === "ACCIONES" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-gray-400 text-sm"
                  >
                    No se encontraron sucursales
                  </td>
                </tr>
              ) : (
                displayed.map((s, i) => {
                  const habilitado = estadoSucursales[s.id] ?? true;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-blue-50/30 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-mono font-bold border border-gray-200">
                          {s.codigo}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-800 font-medium">
                        {s.nombre}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-sm">
                        {s.direccion || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => setModalEditar(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 rounded-lg transition-all shadow-sm"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>

                          {/* Series */}
                          <button
                            type="button"
                            onClick={() => setModalSeries(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-lg transition-all shadow-sm"
                          >
                            <FileText className="w-3 h-3" />
                            Series
                          </button>

                          {/* Habilitar / Inhabilitar */}
                          <button
                            type="button"
                            onClick={() => handleToggleEstado(s.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white active:scale-95 rounded-lg transition-all shadow-sm ${
                              habilitado
                                ? "bg-amber-600 hover:bg-amber-500"
                                : "bg-slate-400 hover:bg-slate-500"
                            }`}
                          >
                            {habilitado ? (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inhabilitar
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Habilitar
                              </>
                            )}
                          </button>

                          {/* Eliminar (solo superadmin) */}
                          {isSuperadmin && (
                            <button
                              type="button"
                              onClick={() => setModalEliminar(s)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 rounded-lg transition-all shadow-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            Mostrando <strong>{displayed.length}</strong> de{" "}
            <strong>{filtered.length}</strong> resultado
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Modals ── */}
      {modalNueva && (
        <NuevaSucursalModal
          nextCode={nextCodigo(sucursales)}
          sucursales={sucursales}
          onClose={() => setModalNueva(false)}
          onSave={handleCrear}
        />
      )}
      {modalEditar && (
        <EditarSucursalModal
          sucursal={modalEditar}
          onClose={() => setModalEditar(null)}
          onSave={handleEditar}
        />
      )}
      {modalSeries && (
        <SeriesSucursalModal
          sucursal={modalSeries}
          onClose={() => setModalSeries(null)}
          onSave={handleEditarSeries}
        />
      )}
      {modalEliminar && (
        <EliminarModal
          sucursal={modalEliminar}
          onClose={() => setModalEliminar(null)}
          onConfirm={handleEliminar}
        />
      )}
    </div>
  );
}
