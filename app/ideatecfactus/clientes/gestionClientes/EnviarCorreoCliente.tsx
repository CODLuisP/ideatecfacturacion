"use client";

import { useState } from "react";
import { CheckCircle2, Mail, Send } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Modal } from "@/app/components/ui/Modal";
import { Cliente } from "./Cliente";

interface Props {
  cliente: Cliente;
  onClose: () => void;
}

export const EnviarCorreoCliente: React.FC<Props> = ({ cliente, onClose }) => {
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    // simulación de envío
    await new Promise((r) => setTimeout(r, 1400));

    setLoading(false);
    setSent(true);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Enviar correo a ${cliente.razonSocialNombre}`}
    >
      {sent ? (
        <div className="text-center py-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <p className="font-bold text-slate-900 mb-1">¡Correo enviado!</p>
          <p className="text-sm text-slate-500 mb-5">
            Mensaje enviado a
            <span className="font-semibold"> {cliente.correo}</span>
          </p>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
            <Mail size={14} className="text-slate-400" />
            <span className="text-slate-500">Para:</span>
            <span className="font-semibold text-slate-800">
              {cliente.correo ?? "-"}
            </span>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Asunto
            </label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej: Comprobante de pago - Mayo 2025"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Mensaje
            </label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={4}
              placeholder="Escribe tu mensaje aquí..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
