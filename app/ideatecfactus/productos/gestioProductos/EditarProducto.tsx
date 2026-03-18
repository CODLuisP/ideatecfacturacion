"use client";

import React from "react";
import axios from "axios";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import { InputBase } from "@/app/components/ui/InputBase";
import { Producto, NuevoProducto, Categoria, EditProducto } from "./Producto";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
  onProductoEditado: (producto: Producto) => void;
  categorias: Categoria[];
}

interface FormFieldsProps {
  form: NuevoProducto;
  setForm: React.Dispatch<React.SetStateAction<NuevoProducto>>;
  precioInput: string;
  setPrecioInput: React.Dispatch<React.SetStateAction<string>>;
  onChange: (field: keyof NuevoProducto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  categorias: Categoria[];
}

export default function EditarProducto({
  isOpen,
  onClose,
  producto,
  onProductoEditado,
  categorias
}: Props) {
  const [form, setForm] = React.useState<NuevoProducto>({
    codigo: "",
    tipoProducto: "BIEN",
    codigoSunat: "",
    descripcion: "",
    unidadMedida: "NIU",
    precioUnitario: 0,
    tipoAfectacionIGV: "10",
    incluirIGV: true,
    stock: 0,
    categoriaId: 0
  });

  // 🔥 estado SOLO para el input visual del precio
  const [precioInput, setPrecioInput] = React.useState("0.00");

  React.useEffect(() => {
    if (!producto) return;

    setForm({
      codigo: producto.codigo,
      tipoProducto: producto.tipoProducto ?? "BIEN",
      codigoSunat: producto.codigoSunat ?? "",
      descripcion: producto.descripcion,
      unidadMedida: producto.unidadMedida,
      precioUnitario: producto.precioUnitario,
      tipoAfectacionIGV: producto.tipoAfectacionIGV,
      incluirIGV: producto.incluirIGV,
      stock: producto.stock,
      categoriaId: producto.categoria?.categoriaId ?? 0
    });

    // 🔥 mostrar siempre con 2 decimales
    setPrecioInput(producto.precioUnitario.toFixed(2));
  }, [producto]);

  // 🔥 FIX categoriaId (lo tuyo se mantiene)
  const handleFormChange =
    (field: keyof NuevoProducto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const target = e.target as HTMLInputElement;

      let value: any;

      if (target.type === "checkbox") {
        value = target.checked;
      } else if (target.type === "number") {
        value = Number(target.value);
      } else if (field === "categoriaId") {
        value = Number(target.value);
      } else {
        value = target.value;
      }

      setForm((prev) => ({
        ...prev,
        [field]: value
      }));
    };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto) return;

    const categoriaSeleccionada = categorias.find(
      (c) => c.categoriaId === form.categoriaId
    );

    if (!categoriaSeleccionada) {
      console.error("Categoría no encontrada");
      return;
    }

    const payload: EditProducto = {
      ...form,
      precioUnitario: Number(precioInput || 0), // 🔥 usa el valor visual
      productoId: producto.productoId
    };

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Producto/${producto.productoId}`,
        payload
      );

      const productoActualizado: Producto = {
        ...producto,
        ...form,
        precioUnitario: Number(precioInput || 0),
        categoria: categoriaSeleccionada
      };

      onProductoEditado(productoActualizado);
      onClose();

    } catch (error) {
      console.error("Error editando producto:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Producto"
    >
      <form className="space-y-4" onSubmit={handleEditar}>
        <FormEditarProducto 
          form={form}
          setForm={setForm}
          precioInput={precioInput}
          setPrecioInput={setPrecioInput}
          onChange={handleFormChange}
          categorias={categorias}
        />

        <div className="pt-4 flex justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit">
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FormEditarProducto({ form, setForm, precioInput, setPrecioInput, onChange, categorias }: FormFieldsProps) {
  return (
    <>
      <InputBase
        label="Nombre del Producto"
        value={form.descripcion}
        onChange={onChange("descripcion")}
        placeholder='Ej: Monitor LED 24"'
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">
            Tipo Producto
          </label>
          <select
            value={form.tipoProducto}
            onChange={onChange("tipoProducto")}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          >
            <option value="BIEN">Bien</option>
            <option value="SERVICIO">Servicio</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">
            Categoría
          </label>

          <select
            value={form.categoriaId}
            onChange={onChange("categoriaId")}
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
          <label className="text-xs font-bold text-gray-500 uppercase">
            Tipo Afectación IGV
          </label>
          <select
            value={form.tipoAfectacionIGV}
            onChange={onChange("tipoAfectacionIGV")}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          >
            <option value="10">10 - Gravado</option>
            <option value="20">20 - Exonerado</option>
            <option value="30">30 - Inafecto</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">
            Unidad de Medida
          </label>
          <select
            value={form.unidadMedida}
            onChange={onChange("unidadMedida")}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          >
            <option value="NIU">NIU - Unidad</option>
            <option value="KGM">KGM - Kilogramo</option>
            <option value="LTR">LTR - Litro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {/* 🔥 SOLO ESTE INPUT CAMBIÓ */}
          <InputBase
            label="Precio Unitario"
            type="text"
            value={precioInput}
            onChange={(e) => {
              const value = e.target.value;

              if (/^\d*\.?\d*$/.test(value)) {
                setPrecioInput(value);

                setForm((prev) => ({
                  ...prev,
                  precioUnitario: value === "" ? 0 : parseFloat(value)
                }));
              }
            }}
            onBlur={() => {
              const num = parseFloat(precioInput || "0");
              setPrecioInput(num.toFixed(2));
            }}
            placeholder="0.00"
          />

          {(form.tipoAfectacionIGV === "10") && (
            <div className="flex items-center gap-2 pl-1">
              <input
                type="checkbox"
                checked={form.incluirIGV}
                onChange={onChange("incluirIGV")}
                className="w-4 h-4 accent-brand-blue"
              />

              <label className="text-xs font-semibold text-gray-600">
                Precio Inluye IGV
              </label>
            </div>
          )}
        </div>

        <InputBase
          label="Stock"
          type="number"
          value={String(form.stock)}
          onChange={onChange("stock")}
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputBase
          label="Código SUNAT"
          labelOptional="(opcional)"
          value={form.codigoSunat}
          onChange={onChange("codigoSunat")}
          placeholder="Ej: 43211503"
        />
        <InputBase
          label="Código"
          labelOptional=""
          value={form.codigo}
          onChange={onChange("codigo")}
          placeholder="PROD-001"
        />
      </div>
    </>
  );
}