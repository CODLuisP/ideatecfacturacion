// hooks/useNotificationsDashboard.ts
import { useState, useCallback } from "react";

export interface NotifDoc {
  id: number;
  tipo: "comprobante" | "guia";
  numeroCompleto: string;
  tipoComprobante: string;
  destinatario: string;
  importeTotal?: string;
  tipoMoneda?: string;
  estadoSunat: string;
  fechaActualizacion?: string;
  codigoRespuestaSunat?: string;
  mensajeRespuestaSunat?: string;
}

export interface CertInfo {
  expiryDate: string;
  daysLeft: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

interface State {
  pendingDocs: NotifDoc[];
  allAccepted: NotifDoc[];
  allRejected: NotifDoc[];
  certInfo: CertInfo | null;
  totalPending: number;
  generatedAt: string;
}

const EMPTY: State = {
  pendingDocs: [],
  allAccepted: [],
  allRejected: [],
  certInfo: null,
  totalPending: 0,
  generatedAt: "",
};

interface Params {
  sucursalId?: number | null;
  empresaRuc?: string | null;
}

export function useNotificationsDashboard({ sucursalId, empresaRuc }: Params) {
  const [data, setData] = useState<State>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!sucursalId && !empresaRuc) return;

    const params = new URLSearchParams();
    if (sucursalId) params.set("sucursalId", String(sucursalId));
    if (empresaRuc) params.set("empresaRuc", empresaRuc);

    setLoading(true);
    setError(null);

    try {
      const res = await window.fetch(
        `${process.env.NEXT_PUBLIC_WS_URL?.replace("ws", "http")}/dashboard-notifications?${params}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData({
        pendingDocs:  json.pendingDocs  ?? [],
        allAccepted:  json.allAccepted  ?? [],
        allRejected:  json.allRejected  ?? [],
        certInfo:     json.certInfo     ?? null,
        totalPending: json.totalPending ?? 0,
        generatedAt:  json.generatedAt  ?? "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, empresaRuc]);

  return { ...data, loading, error, refetch: fetch };
}