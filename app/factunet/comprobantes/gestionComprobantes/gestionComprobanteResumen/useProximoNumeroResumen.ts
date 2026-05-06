// useProximoNumeroResumen.ts
import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface UseProximoNumeroResumenReturn {
  numeroEnvio: number | null;
  identificador: string | null;
  loading: boolean;
  fetchProximoNumero: (ruc: string, establecimiento: string, fecha: string) => Promise<void>;
  reset: () => void;
}

export const useProximoNumeroResumen = (): UseProximoNumeroResumenReturn => {
  const { accessToken } = useAuth();
  const [numeroEnvio, setNumeroEnvio] = useState<number | null>(null);
  const [identificador, setIdentificador] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProximoNumero = useCallback(
    async (ruc: string, establecimiento: string, fecha: string) => {
      if (!ruc || !establecimiento || !fecha) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ ruc, establecimiento, fecha });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ResumenComprobante/proximo-numero?${params}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setNumeroEnvio(data.numeroEnvio);
        setIdentificador(data.identificador);
      } catch {
        setNumeroEnvio(1);
        setIdentificador("RC---------");
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  const reset = useCallback(() => {
    setNumeroEnvio(null);
    setIdentificador(null);
  }, []);

  return { numeroEnvio, identificador, loading, fetchProximoNumero, reset };
};