"use client";
import React, { useState } from "react";
import { X, Trash2, Loader2 } from "lucide-react";

interface Props {
  usuario: any;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export function EliminarUsuarioModal({ usuario, onClose, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(usuario.usuarioID);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
              <Trash2 className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">Eliminar Usuario</p>
          </div>
          <p className="text-sm text-gray-600">
            ¿Estás seguro de eliminar a{" "}
            <strong className="text-gray-900">"{usuario.username}"</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl">
            Cancelar
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-60 rounded-xl">
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}