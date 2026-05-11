"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  RotateCcw,
  Trash2,
  SendHorizonal,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/app/utils/cn";
import { ComprobanteListado } from "@/app/factunet/comprobantes/gestionComprobantes/Comprobante";
import { formatFecha, tipoLabel } from "@/app/factunet/comprobantes/gestionComprobantes/helpers";

interface ModalEnvioMasivoProps {
  pendientes: ComprobanteListado[];
  onClose: () => void;
  /** Se llama justo al cerrar el modal para que la página inicie el envío en background */
  onEnviarTodos: (lista: ComprobanteListado[]) => void;
}

export const ModalEnvioMasivo = ({
  pendientes,
  onClose,
  onEnviarTodos,
}: ModalEnvioMasivoProps) => {
  const [lista, setLista] = useState<ComprobanteListado[]>(pendientes);

  const eliminarDeLista = (id: number) =>
    setLista((prev) => prev.filter((c) => c.comprobanteId !== id));

  const handleEnviar = () => {
    if (lista.length === 0) return;
    onEnviarTodos(lista);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh] animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <SendHorizonal size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Envío masivo a SUNAT
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {lista.length} comprobante{lista.length !== 1 ? "s" : ""}{" "}
                pendiente{lista.length !== 1 ? "s" : ""} en cola
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Al hacer clic en <span className="font-semibold">Enviar todos</span>,
            los comprobantes se enviarán a sunat. Podrás ver el progreso en la columna{" "}
            <span className="font-semibold">SUNAT</span> de la tabla.
          </p>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 scrollbar-thin scrollbar-color-[#CBD5E1_transparent]">
          {lista.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
              <FileText size={32} className="opacity-30" />
              <p className="text-sm">No quedan comprobantes en la lista</p>
            </div>
          ) : (
            lista.map((c) => (
              <div
                key={c.comprobanteId}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100/70 border border-gray-100 rounded-xl transition-colors group"
              >
                {/* Icono tipo */}
                <div className="p-1.5 bg-amber-50 rounded-lg shrink-0">
                  <RotateCcw size={13} className="text-amber-500" />
                </div>

                {/* Datos */}
                <div className="flex-1 grid grid-cols-3 gap-2 min-w-0">
                  {/* Fecha */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mt-0.5">
                      {formatFecha(c.fechaCreacion)}
                    </p>
                  </div>

                  {/* Comprobante */}
                  <div>
                    <p className="text-xs font-medium text-gray-900 mt-0.5 truncate">
                      {c.numeroCompleto}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {tipoLabel(c.tipoComprobante)}
                    </p>
                  </div>

                  {/* Cliente */}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">
                      {c.cliente.numeroDocumento}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {c.cliente.razonSocial}
                    </p>
                  </div>
                </div>

                {/* Botón eliminar */}
                <button
                  onClick={() => eliminarDeLista(c.comprobanteId)}
                  title="Quitar de la lista"
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <span className="text-xs text-gray-400">
            {lista.length} de {pendientes.length} comprobantes seleccionados
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviar}
              disabled={lista.length === 0}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-sm",
                lista.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95",
              )}
            >
              <SendHorizonal size={13} />
              Enviar todos
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};