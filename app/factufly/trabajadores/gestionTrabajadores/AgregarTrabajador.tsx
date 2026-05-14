"use client";
import React, { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import { InputBase } from "@/app/components/ui/InputBase";
import { RegistrarTrabajadorDTO } from "./typesTrabajador";

interface Props {
  isOpen: boolean;
  sucursalId: number;
  isSubmitting: boolean;
  onSubmit: (dto: RegistrarTrabajadorDTO) => Promise<void>;
  onClose: () => void;
}

const formInicial = {
  nombres: "",
  apellidos: "",
  dni: "",
  celular: "",
  email: "",
};

export const AgregarTrabajador: React.FC<Props> = ({
  isOpen,
  sucursalId,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState(formInicial);
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

    await onSubmit({
      nombres: form.nombres,
      apellidos: form.apellidos,
      dni: form.dni,
      celular: form.celular || undefined,
      email: form.email || undefined,
      sucursalId,
    });

    setForm(formInicial);
    setErrors({});
  };

  const handleClose = () => {
    setForm(formInicial);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Nuevo Trabajador">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase
            label="Nombres"
            value={form.nombres}
            onChange={(e) => update("nombres", e.target.value)}
            placeholder="Ej: Juan Carlos"
            showError={!!errors.nombres}
            errorMessage={errors.nombres}
          />
          <InputBase
            label="Apellidos"
            value={form.apellidos}
            onChange={(e) => update("apellidos", e.target.value)}
            placeholder="Ej: Pérez Torres"
            showError={!!errors.apellidos}
            errorMessage={errors.apellidos}
          />
        </div>

        <InputBase
          label="DNI"
          value={form.dni}
          onChange={(e) => update("dni", e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="Ej: 12345678"
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
            placeholder="Ej: 987654321"
            showError={false}
          />
          <InputBase
            label="Correo Electrónico"
            labelOptional="(opcional)"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="trabajador@ejemplo.com"
            showError={false}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Trabajador"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};