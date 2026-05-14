"use client";
import React, { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import { InputBase } from "@/app/components/ui/InputBase";
import { Trabajador, EditarTrabajadorDTO } from "./typesTrabajador";

interface Props {
  trabajador: Trabajador;
  isSubmitting: boolean;
  onSave: (id: number, dto: EditarTrabajadorDTO) => Promise<void>;
  onClose: () => void;
}

export const EditarTrabajador: React.FC<Props> = ({
  trabajador,
  isSubmitting,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState({
    nombres: trabajador.nombres,
    apellidos: trabajador.apellidos,
    dni: trabajador.dni,
    celular: trabajador.celular ?? "",
    email: trabajador.email ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombres.trim()) newErrors.nombres = "Campo obligatorio";
    if (!form.apellidos.trim()) newErrors.apellidos = "Campo obligatorio";
    if (!form.dni.trim()) newErrors.dni = "Campo obligatorio";
    else if (form.dni.length !== 8) newErrors.dni = "El DNI debe tener 8 dígitos";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    await onSave(trabajador.id, {
      nombres: form.nombres,
      apellidos: form.apellidos,
      dni: form.dni,
      celular: form.celular || null,
      email: form.email || null,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="Editar Trabajador">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase
            label="Nombres"
            value={form.nombres}
            onChange={(e) => update("nombres", e.target.value)}
            showError={!!errors.nombres}
            errorMessage={errors.nombres}
          />
          <InputBase
            label="Apellidos"
            value={form.apellidos}
            onChange={(e) => update("apellidos", e.target.value)}
            showError={!!errors.apellidos}
            errorMessage={errors.apellidos}
          />
        </div>

        <InputBase
          label="DNI"
          value={form.dni}
          onChange={(e) => update("dni", e.target.value.replace(/\D/g, "").slice(0, 8))}
          maxLength={8}
          showError={!!errors.dni}
          errorMessage={errors.dni}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase
            label="Celular"
            labelOptional="(opcional)"
            value={form.celular}
            onChange={(e) => update("celular", e.target.value)}
            showError={false}
          />
          <InputBase
            label="Correo Electrónico"
            labelOptional="(opcional)"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            showError={false}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};