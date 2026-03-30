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

// 🔥 TODO: reemplazar con el sucursalId real del contexto/sesión
const SUCURSAL_ID = 1;

export default function ProductosPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const { productosBase } = useProductosBaseDisponiblesLista(SUCURSAL_ID);
  const { productosSucursal, loadingSucursal, setProductosSucursal } = useProductosSucursal(SUCURSAL_ID);

  const { categorias } = useCategoriasLista()

  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("Todos");

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [editTarget, setEditTarget] = useState<ProductoSucursal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductoSucursal | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);

  const filtered = productosSucursal.filter(p =>
    (p.nomProducto.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo.toLowerCase().includes(search.toLowerCase())) &&
    (filterCategoria === "Todos" || p.categoria?.categoriaNombre === filterCategoria)
  );

  const handleProductoEditado = (productoEditado: ProductoSucursal) => {
    setProductosSucursal((prev) =>
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
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/Producto/${deleteTarget.productoId}`);
      showToast('Producto elimnado correctamente.', 'success');
      setProductosSucursal((prev) =>
        prev.filter((p) => p.productoId !== deleteTarget.productoId)
      );
      setDeleteTarget(null);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error("Error al eliminar producto:", error); // para el dev

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 404) {
          showToast("No se encontró el producto a eliminar.", "error");
        } else {
          showToast("No se pudo eliminar el producto. Intenta nuevamente.", "error");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <div className="flex gap-2"></div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={filterCategoria}
              onChange={e => setFilterCategoria(e.target.value)}
              className={cn(
                "appearance-none pl-3 pr-8 py-2.5 text-sm font-medium border rounded-xl outline-none cursor-pointer transition-all",
                filterCategoria !== 'Todos'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600'
              )}
            >
              <option value="Todos">Categoría: Todos</option>
              {categorias.map(cat => (
                <option key={cat.categoriaId} value={cat.categoriaNombre}>
                  {cat.categoriaNombre}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4" /> Importar
          </Button>
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="w-4 h-4" /> Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingSucursal && (
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

        {!loadingSucursal && filtered.length === 0 && (
          <p className="text-gray-400 col-span-3 text-center py-12">
            No se encontraron productos.
          </p>
        )}

        {!loadingSucursal && filtered.map((prod) => (
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
        onProductoAgregado={(producto) =>
          setProductosSucursal((prev) => [...prev, producto])
        }
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
