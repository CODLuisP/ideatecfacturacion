import React from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import { Trash2, XCircle } from "lucide-react";

interface ModalEliminarProps {
  isOpen: boolean;
  mensaje: string; //Mensjae inicial es decir: eliminaras al cliente - eliminaras el producto , etc
  nombre: string; //nombre principal del producto o cliente a eliminar
  documento?: string; // codigo del producto o cliente a eliminar
  onClose: () => void;
  onConfirm: () => void;
}

export const ModalEliminar: React.FC<ModalEliminarProps> = ({
  isOpen,
  mensaje,
  nombre,
  documento,
  onClose,
  onConfirm
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación">
      <div className="space-y-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800">
              ¿Estás seguro?
            </p>
            <p className="text-xs text-rose-600 mt-0.5">
              {mensaje} <strong>{nombre}</strong>
              {documento && ` (${documento})`}. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );
};