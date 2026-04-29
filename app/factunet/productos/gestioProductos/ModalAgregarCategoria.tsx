// ModalAgregarCategoria.tsx
"use client";

import React, { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import { InputBase } from "@/app/components/ui/InputBase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAgregarCategoria: (dto: { categoriaNombre: string; descripcion?: string }) => Promise<boolean>;
  loadingCategoria: boolean;
}

export default function ModalAgregarCategoria({
  isOpen,
  onClose,
  onAgregarCategoria,
  loadingCategoria,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState(false);

  const handleClose = () => {
    setNombre("");
    setDescripcion("");
    setError(false);
    onClose();
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError(true);
      return;
    }
    const ok = await onAgregarCategoria({
      categoriaNombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
    });
    if (ok) handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Categoría" className="max-w-sm">
      <div className="space-y-4">
        <InputBase
          label="Nombre"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (error) setError(false);
          }}
          placeholder="Ej: Bebidas, Electrónica..."
          showError={error}
          errorMessage="El nombre es obligatorio"
        />

        <InputBase
          label="Descripción"
          labelOptional="(opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción de la categoría"
          showError={false}
        />

        <div className="pt-2 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loadingCategoria}
            onClick={handleGuardar}
          >
            {loadingCategoria ? "Guardando..." : "Guardar Categoría"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}