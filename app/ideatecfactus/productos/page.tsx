"use client";
import React, { useState } from "react";
import { Search, Upload, Plus, Edit2, Trash2, ChevronDown } from "lucide-react";
import axios from "axios";

import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui/Modal";
import { ModalEliminar } from "@/app/components/ui/ModalEliminar";
import { cn } from "@/app/utils/cn";

import { ProductoSucursal } from "./gestioProductos/Producto";
import AgregarProducto from "./gestioProductos/AgregarProducto";
import EditarProducto from "./gestioProductos/EditarProducto";

import { useProductosSucursal } from "./gestioProductos/useProductosSucursal";
import { useCategoriasLista } from "./gestioProductos/useCategoriasLista";
import { useAuth } from "@/context/AuthContext";
import { useProductosBaseDisponiblesLista } from "./gestioProductos/useProductosBaseDisponiblesLista";
import { useToast } from "@/app/components/ui/Toast";
import { useProductosEmpresaLista } from "./gestioProductos/useProductosEmpresaLista";

// 🔥 TODO: reemplazar con el sucursalId real del contexto/sesión
const SUCURSAL_ID = 1;

export default function ProductosPage() {
  const { showToast } = useToast();
  const { accessToken, user } = useAuth();

  const { productosBase } = useProductosBaseDisponiblesLista();
  const { productosSucursal, loadingSucursal, setProductosSucursal } = useProductosSucursal();
  const { productosEmpresa, loadingEmpresa, setProductosEmpresa } = useProductosEmpresaLista();

  const isSuperAdmin = user?.rol === "superadmin";
  const productos = isSuperAdmin ? productosEmpresa : productosSucursal;
  const loadingProductos = isSuperAdmin ? loadingEmpresa : loadingSucursal;
  const setProductos = isSuperAdmin ? setProductosEmpresa : setProductosSucursal;

  const { categorias } = useCategoriasLista()

  // AFiltros avanzados
  const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
  const [filtroStock, setFiltroStock] = useState(false);
  const [filtroAfectacion, setFiltroAfectacion] = useState<string[]>([]);
  const [filtroTipoProducto, setFiltroTipoProducto] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("Todos");

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [editTarget, setEditTarget] = useState<ProductoSucursal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductoSucursal | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);

  // REEMPLAZA el bloque filtered:
  const filtrosAvanzadosActivos =
    filtroStock || filtroAfectacion.length > 0 || filtroTipoProducto.length > 0;

  const filtered = productos.filter((p) => {
    const matchSearch =
      p.nomProducto.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase());

    const matchCategoria =
      filterCategoria === "Todos" ||
      p.categoria?.categoriaNombre === filterCategoria;

    const matchStock = !filtroStock || p.sucursalProducto.stock === 0;

    const matchAfectacion =
      filtroAfectacion.length === 0 ||
      filtroAfectacion.includes(p.tipoAfectacionIGV);

    const matchTipo =
      filtroTipoProducto.length === 0 ||
      filtroTipoProducto.includes(p.tipoProducto ?? "");

    return matchSearch && matchCategoria && matchStock && matchAfectacion && matchTipo;
  });

  const handleProductoEditado = (productoEditado: ProductoSucursal) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.productoId === productoEditado.productoId ? productoEditado : p
      )
    );
  };

  const handleOpenEdit = (prod: ProductoSucursal) => {
    setEditTarget(prod);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (prod: ProductoSucursal) => {
    setDeleteTarget(prod);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/productos/${deleteTarget.productoId}`,  
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      showToast('Producto eliminado correctamente.', 'success');
      setProductos((prev) =>
        prev.filter((p) => p.productoId !== deleteTarget.productoId)
      );
      setDeleteTarget(null);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error("Error al eliminar producto:", error);

    if (axios.isAxiosError(error)) {
      if (!error.response) {
        // Sin conexión o API no responde
        showToast("Sin conexión. Verifica tu internet e intenta nuevamente.", "error");
      } else {
        const status = error.response.status;
        if (status === 404) {
          showToast("No se encontró el producto a eliminar.", "error");
        } else if (status === 403) {
          showToast("No tienes permisos para eliminar este producto.", "error");
        } else {
          showToast("No se pudo eliminar el producto. Intenta nuevamente.", "error");
        }
      }
      } else {
        showToast("Error inesperado. Intenta nuevamente.", "error");
      }
    }
  };

  const handleImport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsImportOpen(false);
    setImportFile(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">

          {/* Buscador — izquierda */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos por código o nombre..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Filtros + acciones — derecha */}
          <div className="flex items-center gap-2">

            {/* Categoría */}
            <div className="relative">
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className={cn(
                  "appearance-none pl-3 pr-8 py-2 text-sm font-medium border rounded-xl outline-none cursor-pointer transition-all",
                  filterCategoria !== "Todos"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600"
                )}
              >
                <option value="Todos">Categoría: Todos</option>
                {categorias.map((cat) => (
                  <option key={cat.categoriaId} value={cat.categoriaNombre}>
                    {cat.categoriaNombre}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Filtros Avanzados */}
            <button
              onClick={() => setShowFiltrosAvanzados((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-xl transition-all whitespace-nowrap",
                filtrosAvanzadosActivos
                  ? "bg-violet-50 border-violet-300 text-violet-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filtros avanzados
              {filtrosAvanzadosActivos && (
                <span className="bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {[filtroStock, ...filtroAfectacion, ...filtroTipoProducto].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Separador */}
            <div className="w-px h-6 bg-gray-200" />

            {/* Botones acción */}
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4" /> Importar
            </Button>
            <Button onClick={() => setIsNewOpen(true)}>
              <Plus className="w-4 h-4" /> Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Panel filtros avanzados — barra full width compacta */}
        {showFiltrosAvanzados && (
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 animate-in fade-in duration-200">
            
            {/* Label */}
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap shrink-0">
              Filtrar por
            </span>

            <div className="w-px h-4 bg-gray-200 shrink-0" />

            {/* Stock */}
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={filtroStock}
                onChange={(e) => setFiltroStock(e.target.checked)}
                className="w-3.5 h-3.5 accent-violet-600"
              />
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                Sin stock
              </span>
            </label>

            <div className="w-px h-4 bg-gray-200 shrink-0" />

            {/* Afectación IGV */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap shrink-0">IGV</span>
              <div className="flex gap-1">
                {[
                  { value: "10", label: "Gravado",   color: "bg-blue-100 text-blue-700 border-blue-300" },
                  { value: "20", label: "Exonerado", color: "bg-green-100 text-green-700 border-green-300" },
                  { value: "30", label: "Inafecto",  color: "bg-amber-100 text-amber-700 border-amber-300" },
                ].map(({ value, label, color }) => {
                  const active = filtroAfectacion.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFiltroAfectacion((prev) =>
                          active ? prev.filter((v) => v !== value) : [...prev, value]
                        )
                      }
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold border rounded-lg transition-all whitespace-nowrap",
                        active ? color : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-px h-4 bg-gray-200 shrink-0" />

            {/* Tipo Producto */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap shrink-0">Tipo</span>
              <div className="flex gap-1">
                {[
                  { value: "BIEN",     label: "📦 Bien" },
                  { value: "SERVICIO", label: "⚙️ Servicio" },
                ].map(({ value, label }) => {
                  const active = filtroTipoProducto.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFiltroTipoProducto((prev) =>
                          active ? prev.filter((v) => v !== value) : [...prev, value]
                        )
                      }
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold border rounded-lg transition-all whitespace-nowrap",
                        active
                          ? "bg-violet-50 border-violet-300 text-violet-700"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Limpiar — empujado a la derecha */}
            {filtrosAvanzadosActivos && (
              <>
                <div className="flex-1" />
                <button
                  onClick={() => {
                    setFiltroStock(false);
                    setFiltroAfectacion([]);
                    setFiltroTipoProducto([]);
                  }}
                  className="text-xs text-gray-400 hover:text-rose-500 font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  ✕ Limpiar filtros
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingProductos  && (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="flex justify-between pt-4">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-12" />
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-200 rounded w-24" />
                </div>
              </div>
            </div>
          ))
        )}

        {!loadingProductos  && filtered.length === 0 && (
          <p className="text-gray-400 col-span-3 text-center py-12">
            No se encontraron productos.
          </p>
        )}

        {!loadingProductos  && filtered.map((prod) => (
          <Card key={prod.productoId} className="group hover:border-brand-blue transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {prod.codigo}
                </p>
                {/*nomProducto */}
                <h4 className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">
                  {prod.nomProducto}
                </h4>
                <p className="text-xs text-gray-500">
                  {prod.categoria?.categoriaNombre}
                </p>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="p-1.5 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenDelete(prod)}
                  className="p-1.5 text-gray-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Stock</p>
                <p className={cn("text-lg font-bold", prod.sucursalProducto.stock === 0 ? "text-rose-500" : "text-gray-900")}>
                  {prod.tipoProducto === "SERVICIO" || prod.sucursalProducto.stock === null ? (
                    "N/A"
                  ) : (
                    <>
                      {prod.sucursalProducto.stock}{" "}
                      <span className="text-xs font-normal text-gray-400">unid.</span>
                    </>
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold">
                  {prod.tipoAfectacionIGV === "10" ? "Gravado" : prod.tipoAfectacionIGV === "20" ? "Exonerado" : "Inafecto"}
                </p>
                <p className="text-xs text-gray-400 uppercase font-bold">
                  {prod.tipoAfectacionIGV === "10" ? (prod.incluirIGV ? "Precio (Inc. IGV)" : "Precio (Sin. IGV)") : "Precio (NA. IGV)"}
                </p>
                {/*prod.sucursalProducto.precioUnitario */}
                <p className="text-xl font-black text-brand-blue">
                  S/ {prod.sucursalProducto.precioUnitario.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AgregarProducto
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onProductoAgregado={(producto) => setProductos((prev) => [...prev, producto])}
        categorias={categorias}
        productosBase={productosBase}
        sucursalId={SUCURSAL_ID}
      />
      <EditarProducto
        isOpen={isEditOpen}
        producto={editTarget}
        onClose={() => setIsEditOpen(false)}
        onProductoEditado={handleProductoEditado}
        categorias={categorias}
      />

      {/* Modal importar — sin cambios */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Importar Productos">
        <form className="space-y-5" onSubmit={handleImport}>
          <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-blue transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600 mb-1">Arrastra tu archivo aquí o haz click</p>
            <p className="text-xs text-gray-400 mb-3">Formatos: .csv, .xlsx</p>
            {importFile ? (
              <span className="text-xs text-brand-blue font-semibold">✓ {importFile.name}</span>
            ) : (
              <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg">Seleccionar archivo</span>
            )}
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-700 mb-1 uppercase">Columnas esperadas</p>
            <p className="text-xs text-blue-600 font-mono">
              codigo, tipoProducto, codigoSunat, nomProducto, unidadMedida,
              tipoAfectacionIGV, incluirIGV, categoriaId, sucursalId, precioUnitario, stock
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={!importFile}>Importar</Button>
          </div>
        </form>
      </Modal>

      <ModalEliminar
        isOpen={isDeleteOpen}
        mensaje="Eliminarás el producto"
        nombre={deleteTarget?.nomProducto ?? ""}
        documento={deleteTarget?.codigo}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function useProductosBaseLista(): { productosBase: any; } {
  throw new Error("Function not implemented.");
}
