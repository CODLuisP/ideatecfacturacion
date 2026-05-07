"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Download, FileSpreadsheet, Filter,
  Calendar, User, Building2, Hash,
  SortAsc, FileText, Loader2, ChevronDown, Check
} from "lucide-react";
import { cn } from "@/app/utils/cn";
import { Button } from "@/app/components/ui/Button";
import { DropdownUsuario } from "@/app/components/ui/DropdownUsuario";
import { FiltrosReporteModal } from "@/app/factunet/reportes/gestionReportes/Reportes";
import { UsuarioReporte } from "@/app/factunet/reportes/gestionReportes/UseUsuariosReporte";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Sucursal {
  sucursalId: number;
  nombre: string;
  codEstablecimiento: string;
}

interface ModalReportesProps {
  abierto: boolean;
  onCerrar: () => void;
  filtros: FiltrosReporteModal;
  onSetFiltro: <K extends keyof FiltrosReporteModal>(key: K, value: FiltrosReporteModal[K]) => void;
  onResetFiltros: () => void;
  usuarios: UsuarioReporte[];
  sucursales: Sucursal[];
  isSuperAdmin: boolean;
  puedeVerUsuarios: boolean;
  loadingExcelListado: boolean;
  loadingExcelProductos: boolean;
  loadingExcelMedios: boolean;
  onDescargarListado: (filtros: FiltrosReporteModal) => Promise<void>;
  onDescargarProductos: (filtros: FiltrosReporteModal) => Promise<void>;
  onDescargarMedios: (filtros: FiltrosReporteModal) => Promise<void>;
}

// ── Helper fecha hoy ──────────────────────────────────────────────────────────
const getHoyString = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

// ── Dropdown Sucursal inline para el modal ────────────────────────────────────
function SucursalSelect({
  sucursales,
  seleccionada,
  onSelect,
}: {
  sucursales: Sucursal[];
  seleccionada: string | null;
  onSelect: (cod: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const actual = sucursales.find((s) => s.codEstablecimiento === seleccionada);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm transition-all hover:border-gray-300",
          open && "border-blue-400 ring-2 ring-blue-50"
        )}
      >
        <span className={cn("font-medium", actual ? "text-gray-800" : "text-gray-400")}>
          {actual?.nombre || "Todas las sucursales"}
        </span>
        <ChevronDown size={14} className={cn("text-gray-400 transition-transform", open && "rotate-180 text-blue-500")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-1.5 max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => { onSelect(null); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors text-xs font-bold",
                  seleccionada === null ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-600"
                )}
              >
                Todas las sucursales
                {seleccionada === null && <Check size={12} className="text-blue-600" />}
              </button>
              {sucursales.map((s) => (
                <button
                  key={s.sucursalId}
                  type="button"
                  onClick={() => { onSelect(s.codEstablecimiento); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors text-xs font-bold",
                    seleccionada === s.codEstablecimiento ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-600"
                  )}
                >
                  {s.nombre}
                  {seleccionada === s.codEstablecimiento && <Check size={12} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Botón de reporte ──────────────────────────────────────────────────────────
function ReporteBtn({
  icon: Icon,
  label,
  descripcion,
  loading,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  descripcion: string;
  loading: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "group w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
        "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
        color
      )}
    >
      <div className="shrink-0 p-2 rounded-lg bg-white shadow-sm">
        {loading
          ? <Loader2 size={18} className="animate-spin text-gray-400" />
          : <Icon size={18} className="text-current" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-gray-800">{label}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{descripcion}</p>
      </div>
      <Download size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
    </button>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export function ModalReportes({
  abierto,
  onCerrar,
  filtros,
  onSetFiltro,
  onResetFiltros,
  usuarios,
  sucursales,
  isSuperAdmin,
  puedeVerUsuarios,
  loadingExcelListado,
  loadingExcelProductos,
  loadingExcelMedios,
  onDescargarListado,
  onDescargarProductos,
  onDescargarMedios,
}: ModalReportesProps) {

  const hayDescarga = loadingExcelListado || loadingExcelProductos || loadingExcelMedios;

  return (
    <AnimatePresence>
      {abierto && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onCerrar}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <FileSpreadsheet size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900">Generar Reportes Excel</h2>
                    <p className="text-[10px] text-gray-500">Configura los filtros y descarga el reporte</p>
                  </div>
                </div>
                <button
                  onClick={onCerrar}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* ── Filtros ─────────────────────────────────────────────── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Filter size={13} className="text-gray-400" />
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Filtros</span>
                    <span className="text-[10px] text-gray-400">(opcionales)</span>
                  </div>

                  <div className="space-y-3">

                    {/* Sucursal — solo superadmin */}
                    {isSuperAdmin && sucursales.length > 0 && (
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 mb-1.5">
                          <Building2 size={11} className="text-gray-400" />
                          Sucursal
                        </label>
                        <SucursalSelect
                          sucursales={sucursales}
                          seleccionada={filtros.codEstablecimiento ?? null}
                          onSelect={(cod) => onSetFiltro("codEstablecimiento", cod)}
                        />
                      </div>
                    )}

                    {/* Fechas */}
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 mb-1.5">
                        <Calendar size={11} className="text-gray-400" />
                        Rango de Fechas
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-400 mb-1">Desde</p>
                          <input
                            type="date"
                            value={filtros.fechaDesde ?? ""}
                            max={getHoyString()}
                            onChange={(e) => {
                              onSetFiltro("fechaDesde", e.target.value || null);
                              if (filtros.fechaHasta && e.target.value > filtros.fechaHasta)
                                onSetFiltro("fechaHasta", null);
                            }}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-gray-50"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 mb-1">Hasta</p>
                          <input
                            type="date"
                            value={filtros.fechaHasta ?? ""}
                            min={filtros.fechaDesde ?? undefined}
                            max={getHoyString()}
                            onChange={(e) => onSetFiltro("fechaHasta", e.target.value || null)}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-gray-50"
                          />
                        </div>
                      </div>
                      {/* Shortcuts de período */}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {[
                          { label: "Hoy", fn: () => { const h = getHoyString(); onSetFiltro("fechaDesde", h); onSetFiltro("fechaHasta", h); } },
                          { label: "Esta semana", fn: () => {
                            const hoy = new Date();
                            const lunes = new Date(hoy);
                            lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
                            const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                            onSetFiltro("fechaDesde", fmt(lunes));
                            onSetFiltro("fechaHasta", fmt(hoy));
                          }},
                          { label: "Este mes", fn: () => {
                            const hoy = new Date();
                            const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                            onSetFiltro("fechaDesde", `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-01`);
                            onSetFiltro("fechaHasta", fmt(hoy));
                          }},
                          { label: "Este año", fn: () => {
                            const hoy = new Date();
                            const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                            onSetFiltro("fechaDesde", `${hoy.getFullYear()}-01-01`);
                            onSetFiltro("fechaHasta", fmt(hoy));
                          }},
                        ].map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={s.fn}
                            className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 rounded-lg transition-colors"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Usuario */}
                    {puedeVerUsuarios && usuarios.length > 0 && (
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 mb-1.5">
                          <User size={11} className="text-gray-400" />
                          Usuario
                        </label>
                        <DropdownUsuario
                          usuarios={usuarios}
                          seleccionado={filtros.usuarioCreacion ?? null}
                          onSelect={(id) => onSetFiltro("usuarioCreacion", id)}
                        />
                      </div>
                    )}

                    {/* Doc Cliente */}
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 mb-1.5">
                        <Hash size={11} className="text-gray-400" />
                        Documento del Cliente
                      </label>
                      <input
                        type="text"
                        placeholder="RUC o DNI del cliente (opcional)"
                        value={filtros.clienteNumDoc ?? ""}
                        onChange={(e) => onSetFiltro("clienteNumDoc", e.target.value || null)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-gray-50 placeholder:text-gray-300"
                      />
                    </div>

                    {/* Límite + OrderBy */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 mb-1.5">
                          <Hash size={11} className="text-gray-400" />
                          Límite de registros
                        </label>
                        <input
                          type="number"
                          placeholder="Sin límite"
                          min={1}
                          value={filtros.limit ?? ""}
                          onChange={(e) => onSetFiltro("limit", e.target.value ? Number(e.target.value) : null)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-gray-50 placeholder:text-gray-300"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 mb-1.5">
                          <SortAsc size={11} className="text-gray-400" />
                          Ordenar productos por
                        </label>
                        <select
                          value={filtros.orderBy ?? "monto"}
                          onChange={(e) => onSetFiltro("orderBy", e.target.value as "monto" | "cantidad" | "veces")}
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-gray-50"
                        >
                          <option value="monto">Mayor monto</option>
                          <option value="cantidad">Mayor cantidad</option>
                          <option value="veces">Más vendido</option>
                        </select>
                      </div>
                    </div>

                    {/* Nombre del archivo */}
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 mb-1.5">
                        <FileText size={11} className="text-gray-400" />
                        Nombre del archivo
                        <span className="text-[10px] text-gray-400 font-normal">(se genera automáticamente si no lo completas)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: ventas-mayo-2025"
                        value={filtros.tituloPersonalizado ?? ""}
                        onChange={(e) => onSetFiltro("tituloPersonalizado", e.target.value || null)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-gray-50 placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Botones de descarga ──────────────────────────────────── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Download size={13} className="text-gray-400" />
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Descargar Reporte</span>
                  </div>

                  <div className="space-y-2">
                    <ReporteBtn
                      icon={FileSpreadsheet}
                      label="Listado de Comprobantes"
                      descripcion="Todos los comprobantes aceptados con detalle de cliente, montos e IGV"
                      loading={loadingExcelListado}
                      onClick={() => onDescargarListado(filtros)}
                      color="border-blue-100 hover:border-blue-300 hover:bg-blue-50/50 text-blue-600"
                    />
                    <ReporteBtn
                      icon={SortAsc}
                      label="Top Productos Vendidos"
                      descripcion="Ranking de productos por cantidad, monto o veces vendido"
                      loading={loadingExcelProductos}
                      onClick={() => onDescargarProductos(filtros)}
                      color="border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 text-emerald-600"
                    />
                    <ReporteBtn
                      icon={Hash}
                      label="Medios de Pago"
                      descripcion="Análisis de medios de pago más usados y montos totales"
                      loading={loadingExcelMedios}
                      onClick={() => onDescargarMedios(filtros)}
                      color="border-orange-100 hover:border-orange-300 hover:bg-orange-50/50 text-orange-600"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl sticky bottom-0">
                <button
                  type="button"
                  onClick={onResetFiltros}
                  disabled={hayDescarga}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  Limpiar filtros
                </button>
                <Button
                  variant="outline"
                  onClick={onCerrar}
                  disabled={hayDescarga}
                  className="text-xs"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}