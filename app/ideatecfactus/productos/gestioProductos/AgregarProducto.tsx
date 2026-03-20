"use client";

import React from "react";
import axios from "axios";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import { InputBase } from "@/app/components/ui/InputBase";
import { Categoria, NuevoProducto, ProductoBase, ProductoSucursal } from "./Producto";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductoAgregado: (producto: ProductoSucursal) => void;
  categorias: Categoria[];
  productosBase: ProductoBase[];
  sucursalId: number;
}

const emptyForm: NuevoProducto = {
  codigo: "",
  tipoProducto: "BIEN",
  codigoSunat: "",
  nomProducto: "",
  unidadMedida: "NIU",
  tipoAfectacionIGV: "10",
  incluirIGV: true,
  categoriaId: 0,
  sucursalId: 0,
  precioUnitario: 0,
  stock: 0,
};

export default function AgregarProducto({
  isOpen,
  onClose,
  onProductoAgregado,
  categorias,
  productosBase,
  sucursalId,
}: Props) {
  const [form, setForm] = React.useState<NuevoProducto>(emptyForm);
  const [productoExistente, setProductoExistente] = React.useState<ProductoBase | null>(null);

  // sugerencias del buscador
  const [sugerencias, setSugerencias] = React.useState<ProductoBase[]>([]);
  const [showSugerencias, setShowSugerencias] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setForm({ ...emptyForm, sucursalId }); // 🔥 agregar esto
    } else {
      setForm({ ...emptyForm, sucursalId });
      setProductoExistente(null);
      setSugerencias([]);
      setShowSugerencias(false);
    }
  }, [isOpen, sucursalId]);

  // ─── Búsqueda en productosBase mientras escribe ───────────
  const handleNomProductoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, nomProducto: value }));
    setProductoExistente(null); // limpiar autocompletado si edita

    if (value.trim().length === 0) {
      setSugerencias([]);
      setShowSugerencias(false);
      return;
    }

    const matches = productosBase.filter((p) =>
      p.nomProducto.toLowerCase().includes(value.toLowerCase())
    );
    setSugerencias(matches);
    setShowSugerencias(matches.length > 0);
  };

  // ─── Al seleccionar una sugerencia: autocompletar ─────────
  const handleSeleccionarSugerencia = (prod: ProductoBase) => {
    setProductoExistente(prod);
    setForm((prev) => ({
      ...prev,
      nomProducto: prod.nomProducto,
      codigo: prod.codigo,
      tipoProducto: prod.tipoProducto ?? "BIEN",
      codigoSunat: prod.codigoSunat ?? "",
      unidadMedida: prod.unidadMedida,
      tipoAfectacionIGV: prod.tipoAfectacionIGV,
      incluirIGV: prod.incluirIGV,
      categoriaId: prod.categoria?.categoriaId ?? 0,
      // stock y precioUnitario se mantienen en 0 para que el usuario los ingrese
    }));
    setSugerencias([]);
    setShowSugerencias(false);
  };

  const handleFormChange =
    (field: keyof NuevoProducto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const target = e.target as HTMLInputElement;
      let value: string | number | boolean =
        target.type === "checkbox"
          ? target.checked
          : target.type === "number"
          ? Number(target.value)
          : target.value;

      if (field === "tipoAfectacionIGV") {
        const aplicaIGV = value === "10";
        setForm((prev) => ({
          ...prev,
          tipoAfectacionIGV: value as string,
          incluirIGV: aplicaIGV ? prev.incluirIGV : true,
        }));
        return;
      }
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("producto enviado:", form);
      const response = await axios.post<ProductoSucursal>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Producto`,
        form
      );
      onProductoAgregado(response.data);
      setForm({ ...emptyForm, sucursalId });
      onClose();
    } catch (error) {
      console.error("Error guardando producto:", error);
    }
  };

  const soloSucursal = !!productoExistente; // si autocompletó, solo pide stock y precio

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Producto">
      <form className="space-y-4" onSubmit={handleGuardar}>

        {/* ── Nombre con búsqueda ── */}
        <div className="relative space-y-1.5">
          <InputBase
            label="Nombre del Producto"
            value={form.nomProducto}
            onChange={handleNomProductoChange}
            placeholder='Buscar o escribir nombre...'
            required
          />
          {showSugerencias && (
            <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {sugerencias.map((p) => (
                <li
                  key={p.productoId}
                  onMouseDown={() => handleSeleccionarSugerencia(p)}
                  className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-brand-blue"
                >
                  <span className="font-semibold">{p.nomProducto}</span>
                  <span className="text-xs text-gray-400 ml-2">{p.codigo}</span>
                </li>
              ))}
            </ul>
          )}
          {productoExistente && (
            <p className="text-xs text-green-600 font-semibold pl-1">
              ✓ Producto encontrado — completa stock y precio para esta sucursal
            </p>
          )}
        </div>

        {/* ── Campos base (ocultos si ya existe en tabla base) ── */}
        {!soloSucursal && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Tipo Producto</label>
                <select
                  value={form.tipoProducto}
                  onChange={handleFormChange("tipoProducto")}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                >
                  <option value="BIEN">Bien</option>
                  <option value="SERVICIO">Servicio</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                <select
                  value={form.categoriaId}
                  onChange={handleFormChange("categoriaId")}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                >
                  <option value={0}>Seleccione categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.categoriaId} value={cat.categoriaId}>
                      {cat.categoriaNombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Tipo Afectación IGV</label>
                <select
                  value={form.tipoAfectacionIGV}
                  onChange={handleFormChange("tipoAfectacionIGV")}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                >
                  <option value="10">10 - Gravado</option>
                  <option value="20">20 - Exonerado</option>
                  <option value="30">30 - Inafecto</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Unidad de Medida</label>
                <select
                  value={form.unidadMedida}
                  onChange={handleFormChange("unidadMedida")}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                >
                  <option value="NIU">NIU - Unidad</option>
                  <option value="KGM">KGM - Kilogramo</option>
                  <option value="LTR">LTR - Litro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputBase
                label="Código SUNAT"
                labelOptional="(opcional)"
                value={form.codigoSunat}
                onChange={handleFormChange("codigoSunat")}
                placeholder="Ej: 43211503"
              />
              <InputBase
                label="Código"
                value={form.codigo}
                onChange={handleFormChange("codigo")}
                placeholder="PROD-001"
              />
            </div>
          </>
        )}

        {/* ── Stock y Precio (siempre visibles) ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <InputBase
              label="Precio Unitario"
              type="number"
              value={String(form.precioUnitario)}
              onChange={handleFormChange("precioUnitario")}
              placeholder="0.00"
              step="0.01"
            />
            {(form.tipoAfectacionIGV === "10") && (
              <div className="flex items-center gap-2 pl-1">
                <input
                  type="checkbox"
                  checked={form.incluirIGV}
                  onChange={handleFormChange("incluirIGV")}
                  className="w-4 h-4 accent-brand-blue"
                />
                <label className="text-xs font-semibold text-gray-600">
                  Precio Incluye IGV
                </label>
              </div>
            )}
          </div>

          <InputBase
            label="Stock"
            type="number"
            value={String(form.stock)}
            onChange={handleFormChange("stock")}
            placeholder="0"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Producto</Button>
        </div>
      </form>
    </Modal>
  );
}