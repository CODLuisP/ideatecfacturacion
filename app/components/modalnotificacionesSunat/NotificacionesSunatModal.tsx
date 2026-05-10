// components/NotificacionesSunatModal.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Bell, CheckCircle2, AlertTriangle, XCircle,
  Calendar, FileText, ShieldCheck, X,
} from "lucide-react";
import { cn } from "@/app/utils/cn";
import { useNotificationsDashboard, type NotifDoc, type CertInfo } from "@/hooks/useNotificationsDashboard";

// ── Tipos internos del modal ──────────────────────────────────────────────────

type NotifType = "success" | "warning" | "error" | "info";

interface ModalNotif {
  id: string;
  title: string;
  desc: string;
  type: NotifType;
  detail: string;
  fecha: string;
  numeroCompleto?: string;
  codigoSunat?: string;
  mensaje?: string;
}

// ── Conversores ───────────────────────────────────────────────────────────────

function docToNotif(doc: NotifDoc, tipo: "aceptado" | "rechazado" | "pendiente"): ModalNotif {
  const esGuia = doc.tipo === "guia";
  const labelTipo = esGuia ? "Guía de Remisión" : doc.tipoComprobante === "01" ? "Factura" : "Boleta";

  if (tipo === "aceptado") {
    return {
      id: `a-${doc.id}`,
      title: "CDR Aceptado",
      desc: `${labelTipo} ${doc.numeroCompleto} aceptada.`,
      type: "success",
      detail: `El comprobante ${doc.numeroCompleto} emitido a ${doc.destinatario}${doc.importeTotal ? ` por ${doc.tipoMoneda ?? "S/"} ${doc.importeTotal}` : ""} fue aceptado por SUNAT.`,
      fecha: doc.fechaActualizacion ?? "",
      numeroCompleto: doc.numeroCompleto,
    };
  }

  if (tipo === "rechazado") {
    return {
      id: `r-${doc.id}`,
      title: "Rechazado por SUNAT",
      desc: `${labelTipo} ${doc.numeroCompleto} rechazada (${doc.codigoRespuestaSunat ?? "—"}).`,
      type: "error",
      detail: doc.mensajeRespuestaSunat ?? "Sin detalle de respuesta.",
      fecha: doc.fechaActualizacion ?? "",
      numeroCompleto: doc.numeroCompleto,
      codigoSunat: doc.codigoRespuestaSunat,
      mensaje: doc.mensajeRespuestaSunat,
    };
  }

  // pendiente
  return {
    id: `p-${doc.id}`,
    title: "Pendiente de Envío",
    desc: `${labelTipo} ${doc.numeroCompleto} pendiente.`,
    type: "warning",
    detail: `El comprobante ${doc.numeroCompleto} aún no ha sido enviado o procesado por SUNAT.`,
    fecha: doc.fechaActualizacion ?? "",
    numeroCompleto: doc.numeroCompleto,
  };
}

function certToNotif(cert: CertInfo): ModalNotif {
  return {
    id: "cert",
    title: cert.isExpired ? "Certificado Expirado" : "Certificado por Vencer",
    desc: cert.isExpired
      ? "El certificado digital ha expirado."
      : `Vence en ${cert.daysLeft} día(s) (${new Date(cert.expiryDate).toLocaleDateString("es-PE")}).`,
    type: cert.isExpired ? "error" : "warning",
    detail: cert.isExpired
      ? "Su certificado digital ha expirado. Renuévelo para poder emitir comprobantes."
      : `Su certificado digital de firma electrónica vence el ${new Date(cert.expiryDate).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}. Le quedan ${cert.daysLeft} días.`,
    fecha: cert.expiryDate,
  };
}

// ── Iconos por tipo ───────────────────────────────────────────────────────────

const ICON_CFG = {
  success: { icon: <CheckCircle2 size={16} />, dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", label: "Éxito",       bg: "bg-emerald-100 text-emerald-600" },
  warning: { icon: <AlertTriangle size={16} />, dot: "bg-amber-500",  badge: "bg-amber-50 text-amber-700",   label: "Advertencia", bg: "bg-amber-100 text-amber-600"   },
  error:   { icon: <XCircle size={16} />,       dot: "bg-rose-500",   badge: "bg-rose-50 text-rose-700",     label: "Error",       bg: "bg-rose-100 text-rose-600"     },
  info:    { icon: <Bell size={16} />,           dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700",     label: "Info",        bg: "bg-blue-100 text-blue-600"     },
};

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  sucursalId?: number | null;
  empresaRuc?: string | null;
}

export const NotificacionesSunatModal: React.FC<Props> = ({ onClose, sucursalId, empresaRuc }) => {
  const { allAccepted, allRejected, pendingDocs, certInfo, loading, error, refetch } =
    useNotificationsDashboard({ sucursalId, empresaRuc });

  useEffect(() => { refetch(); }, [refetch]);

  // Construye lista unificada: rechazados → pendientes → certificado → aceptados
  const notifs: ModalNotif[] = useMemo(() => [
    ...allRejected.map((d) => docToNotif(d, "rechazado")),
    ...pendingDocs.map((d) => docToNotif(d, "pendiente")),
    ...(certInfo && (certInfo.isExpired || certInfo.isExpiringSoon) ? [certToNotif(certInfo)] : []),
    ...allAccepted.map((d) => docToNotif(d, "aceptado")),
  ], [allRejected, pendingDocs, certInfo, allAccepted]);

  const [selected, setSelected] = useState<ModalNotif | null>(null);

  // Selecciona el primero automáticamente
  useEffect(() => {
    if (notifs.length > 0 && !selected) setSelected(notifs[0]);
  }, [notifs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-100 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 text-red-600 shrink-0">
            <Bell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900">Notificaciones SUNAT</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? "Cargando..." : `${notifs.length} evento(s) hoy`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, height: "520px" }}>

          {/* Lista izquierda */}
          <div className="w-[42%] border-r border-slate-100 overflow-y-auto shrink-0">
            {loading && (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            )}
            {!loading && error && (
              <div className="p-6 text-center text-sm text-rose-500">{error}</div>
            )}
            {!loading && !error && notifs.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-400">Sin notificaciones hoy</div>
            )}
            {!loading && notifs.map((notif) => {
              const cfg = ICON_CFG[notif.type];
              return (
                <button
                  key={notif.id}
                  onClick={() => setSelected(notif)}
                  className={cn(
                    "w-full text-left flex gap-3 p-4 border-b border-slate-50 transition-colors border-l-2",
                    selected?.id === notif.id
                      ? "bg-blue-50 border-l-blue-600"
                      : "hover:bg-slate-50 border-l-transparent",
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{notif.title}</p>
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0", cfg.badge)}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notif.desc}</p>
                    {notif.fecha && (
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                        {new Date(notif.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalle derecho */}
          {selected ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", ICON_CFG[selected.type].bg)}>
                  {ICON_CFG[selected.type].icon}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selected.title}</h4>
                  {selected.fecha && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={11} />
                      {new Date(selected.fecha).toLocaleString("es-PE")}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">{selected.detail}</p>
              </div>

              {selected.numeroCompleto && (
                <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/50">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Comprobante Relacionado</p>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">{selected.numeroCompleto}</span>
                  </div>
                </div>
              )}

              {selected.codigoSunat && (
                <div className="border border-rose-100 rounded-xl p-4 bg-rose-50/50">
                  <p className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-1">Código SUNAT</p>
                  <p className="text-sm font-mono text-rose-800">{selected.codigoSunat}</p>
                  {selected.mensaje && (
                    <p className="text-xs text-rose-600 mt-2">{selected.mensaje}</p>
                  )}
                </div>
              )}

              {selected.id === "cert" && (
                <div className="border border-amber-100 rounded-xl p-4 bg-amber-50/50 flex items-center gap-3">
                  <ShieldCheck size={20} className="text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700">Renueve el certificado para continuar emitiendo comprobantes electrónicos.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Selecciona una notificación
            </div>
          )}
        </div>
      </div>
    </div>
  );
};