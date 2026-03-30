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
import { cn } from "@/app/utils/cn";

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
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: "text-blue-600",
    border: "border-blue-100",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-600",
    border: "border-emerald-100",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "text-amber-600",
    border: "border-amber-100",
  },
  slate: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: "text-gray-500",
    border: "border-gray-200",
  },
};

function StatCard({ label, value, icon, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          c.bg,
          c.icon
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className={cn("text-xl font-semibold", c.text)}>{value}</p>
      </div>
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
interface ActionBtnProps {
  onClick: () => void;
  variant: "blue" | "green" | "amber" | "red";
  icon: React.ReactNode;
  label: string;
}

const actionColors = {
  blue: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100",
  red: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100",
};

function ActionBtn({ onClick, variant, icon, label }: ActionBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
        actionColors[variant]
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SucursalesPage() {
  const { showToast } = useToast();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [estadoSucursales, setEstadoSucursales] = useState<Record<string, boolean>>({});

  const [modalNueva, setModalNueva] = useState(false);
  const [modalEditar, setModalEditar] = useState<Sucursal | null>(null);
  const [modalSeries, setModalSeries] = useState<Sucursal | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);

  const { accessToken, user } = useAuth();
  const isSuperadmin = user?.rol === "superadmin";
  const visibleSucursales = isSuperadmin ? sucursales : sucursales.slice(0, 1);

  const filtered = visibleSucursales.filter(
    (s) =>
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.codigo.includes(search)
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
        }
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
      setEstadoSucursales((prev) => {
        const next = { ...prev };
        data.forEach((s: Sucursal) => {
          if (!(s.id in next)) next[s.id] = true;
        });
        return next;
      });
    } catch {
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
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setModalNueva(false);
      showToast(`Sucursal "${form.nombre}" creada correctamente`, "success");
      fetchSucursales();
    } catch (error: any) {
      showToast(error.response?.data?.mensaje || "Error al crear sucursal", "error");
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
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setModalSeries(null);
      showToast("Series actualizadas correctamente", "success");
      fetchSucursales();
    } catch (error: any) {
      showToast(error.response?.data?.mensaje || "Error al actualizar series", "error");
    }
  };

  const handleEditar = async (id: string, data: EditSucursalForm) => {
    const sucursalId = isSuperadmin ? id : user?.sucursalID;
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${sucursalId}`,
        { nombre: data.nombre, direccion: data.direccion },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setModalEditar(null);
      showToast("Sucursal actualizada correctamente", "success");
      fetchSucursales();
    } catch (error: any) {
      showToast(error.response?.data?.mensaje || "Error al actualizar sucursal", "error");
    }
  };

  const handleEliminar = async (id: string) => {
    const s = sucursales.find((x) => x.id === id);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setModalEliminar(null);
      showToast(`Sucursal "${s?.nombre}" eliminada`, "error");
      fetchSucursales();
    } catch (error: any) {
      showToast(error.response?.data?.mensaje || "Error al eliminar sucursal", "error");
    }
  };

  const handleToggleEstado = (id: string) => {
    setEstadoSucursales((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className=" mx-auto space-y-5 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
     
        </div>
        <button
          type="button"
          onClick={() => setModalNueva(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva sucursal
        </button>
      </div>

      {/* ── Stats (solo superadmin) ── */}
      {isSuperadmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total"
            value={sucursales.length}
            icon={<Building2 className="w-4 h-4" />}
            color="blue"
          />
          <StatCard
            label="Activas"
            value={sucursales.length}
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="green"
          />
          <StatCard
            label="Inactivas"
            value={0}
            icon={<XCircle className="w-4 h-4" />}
            color="amber"
          />
          <StatCard
            label="Series"
            value={totalSeries}
            icon={<BookOpen className="w-4 h-4" />}
            color="slate"
          />
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-400 bg-gray-50 transition-colors placeholder:text-gray-400"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto relative">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 bg-white transition-colors text-gray-700 cursor-pointer"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n} por página</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  { label: "Código", align: "left" },
                  { label: "Nombre", align: "left" },
                  { label: "Dirección", align: "left" },
                  { label: "Estado", align: "left" },
                  { label: "Acciones", align: "right" },
                ].map((h) => (
                  <th
                    key={h.label}
                    className={cn(
                      "px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider",
                      h.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-gray-400 text-sm">
                    No se encontraron sucursales
                  </td>
                </tr>
              ) : (
                displayed.map((s) => {
                  const habilitado = estadoSucursales[s.id] ?? true;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors"
                    >
                      {/* Código */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-mono font-semibold border border-gray-200">
                          {s.codigo}
                        </span>
                      </td>

                      {/* Nombre */}
                      <td className="px-4 py-3.5 font-medium text-gray-800">
                        {s.nombre}
                      </td>

                      {/* Dirección */}
                      <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[220px] truncate">
                        {s.direccion || "—"}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5">
                        {habilitado ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Inactiva
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <ActionBtn
                            onClick={() => setModalEditar(s)}
                            variant="blue"
                            icon={<Edit2 className="w-3 h-3" />}
                            label="Editar"
                          />
                          <ActionBtn
                            onClick={() => setModalSeries(s)}
                            variant="green"
                            icon={<FileText className="w-3 h-3" />}
                            label="Series"
                          />
                          <ActionBtn
                            onClick={() => handleToggleEstado(s.id)}
                            variant="amber"
                            icon={
                              habilitado
                                ? <XCircle className="w-3 h-3" />
                                : <CheckCircle2 className="w-3 h-3" />
                            }
                            label={habilitado ? "Inhabilitar" : "Habilitar"}
                          />
                          {isSuperadmin && (
                            <ActionBtn
                              onClick={() => setModalEliminar(s)}
                              variant="red"
                              icon={<Trash2 className="w-3 h-3" />}
                              label="Eliminar"
                            />
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
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            Mostrando <span className="font-medium text-gray-600">{displayed.length}</span> de{" "}
            <span className="font-medium text-gray-600">{filtered.length}</span> resultado
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