"use client";

import { useState } from "react";
import axios from "axios";
import { CheckCircle2, Mail, Send, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Modal } from "@/app/components/ui/Modal";
import { Cliente } from "./typesCliente";
import { useAuth } from "@/context/AuthContext";

interface Props {
  cliente: Cliente;
  onClose: () => void;
}

export const EnviarCorreoCliente: React.FC<Props> = ({ cliente, onClose }) => {
  const { accessToken } = useAuth();
  const [asunto, setAsunto]   = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cliente.correo) {
      setError("Este cliente no tiene correo registrado.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/email/send`,
        {
          toEmail: cliente.correo,
          toName:  cliente.razonSocialNombre,
          subject: asunto,
          body:    mensaje,
          tipo:    "0",
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` }, 
        }
      );
      setSent(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Error al enviar el correo.");
      } else {
        setError("Error de conexión. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
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
            Mensaje enviado a <span className="font-semibold">{cliente.correo}</span>
          </p>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">

          {/* Destinatario */}
          <div className="bg-slate-50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
            <Mail size={14} className="text-slate-400" />
            <span className="text-slate-500">Para:</span>
            <span className="font-semibold text-slate-800">
              {cliente.correo ?? (
                <span className="text-rose-500 font-medium">Sin correo registrado</span>
              )}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Asunto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Asunto</label>
            <input
              type="text"
              value={asunto}
              onChange={e => setAsunto(e.target.value)}
              placeholder="Ej: Comprobante de pago - Mayo 2025"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm"
              required
            />
          </div>

          {/* Mensaje */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Mensaje</label>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={4}
              placeholder="Escribe tu mensaje aquí..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm resize-none"
              required
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading || !cliente.correo}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={14} /> Enviar
                </>
              )}
            </Button>
          </div>

        </form>
      )}
    </Modal>
  );
};