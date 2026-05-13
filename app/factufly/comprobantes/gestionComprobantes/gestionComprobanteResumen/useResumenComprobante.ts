import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/app/components/ui/Toast";
import { AgregarResumenComprobanteDTO, ComprobanteResumenResponse } from "./resumenComprobantetypes";


interface UseResumenComprobanteReturn {
  loadingRegistrar: boolean;
  loadingEnviar: boolean;
  registrar: (dto: AgregarResumenComprobanteDTO) => Promise<number | null>;
  enviarSunat: (resumenId: number) => Promise<ComprobanteResumenResponse | null>;
}

export const useResumenComprobante = (): UseResumenComprobanteReturn => {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [loadingRegistrar, setLoadingRegistrar] = useState(false);
  const [loadingEnviar, setLoadingEnviar] = useState(false);

  const registrar = useCallback(
    async (dto: AgregarResumenComprobanteDTO): Promise<number | null> => {
      setLoadingRegistrar(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ResumenComprobante`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(dto),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.mensaje ?? `Error ${res.status}`);
        }
        const data = await res.json();
        return data.comprobanteId as number;
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Error al registrar resumen", "error");
        return null;
      } finally {
        setLoadingRegistrar(false);
      }
    },
    [accessToken, showToast]
  );

  const enviarSunat = useCallback(
    async (resumenId: number): Promise<ComprobanteResumenResponse | null> => {
      setLoadingEnviar(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ResumenComprobante/${resumenId}/enviar-sunat`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const data: ComprobanteResumenResponse = await res.json();
        return data;
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Error al enviar a SUNAT", "error");
        return null;
      } finally {
        setLoadingEnviar(false);
      }
    },
    [accessToken, showToast]
  );

  return { loadingRegistrar, loadingEnviar, registrar, enviarSunat };
};