"use client";

import React from "react";
import axios from "axios";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import { InputBase } from "@/app/components/ui/InputBase";
import { Categoria, NuevoProducto, Producto } from "./Producto";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductoAgregado: (producto: Producto) => void;
  categorias: Categoria[]
}

interface FormFieldsProps {
  form: NuevoProducto;
  onChange: (field: keyof NuevoProducto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  categorias: Categoria[];
}

const emptyForm: NuevoProducto = {
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
};

export default function AgregarProducto({
  isOpen,
  onClose,
  onProductoAgregado,
  categorias,
}: Props) {

  const [form, setForm] = React.useState<NuevoProducto>(emptyForm);

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
      setForm((prev) => ({ ...prev, tipoAfectacionIGV: value as string, incluirIGV: aplicaIGV ? prev.incluirIGV : true }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

    const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        
        console.log("producto enviado: ", form)
        /*const response = await axios.post<Producto>( `${process.env.NEXT_PUBLIC_API_URL}/api/Producto`, form ); 
        onProductoAgregado(response.data);
        setForm(emptyForm);
        onClose();*/

    } catch (error) {
        console.error("Error guardando producto:", error);
    }
    };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Producto"
    >
      <form className="space-y-4" onSubmit={handleGuardar}>

        <FormFields form={form} onChange={handleFormChange} categorias={categorias} />

        <div className="pt-4 flex justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button type="submit">
            Guardar Producto
          </Button>
        </div>

      </form>
    </Modal>
  );
}

function FormFields({ form, onChange,categorias }: FormFieldsProps) {
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
          <InputBase
            label="Precio Unitario"
            type="number"
            value={String(form.precioUnitario)}
            onChange={onChange("precioUnitario")}
            placeholder="0.00"
            step="0.01"
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
          label="Código / SKU"
          labelOptional="(opcional)"
          value={form.codigo}
          onChange={onChange("codigo")}
          placeholder="PROD-001"
        />

      </div>
    </>
  );
}