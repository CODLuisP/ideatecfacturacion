"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Trabajador } from "./typesTrabajador";

export function useTrabajadoresSucursal(sucursalId: number | undefined, enabled = true) {
  const { accessToken } = useAuth();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);

  useEffect(() => {
    if (!enabled || !sucursalId || sucursalId === 0) return;

    const fetchTrabajadores = async () => {
      setLoadingTrabajadores(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Trabajador/sucursal/${sucursalId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setTrabajadores(res.data ?? []);
      } catch (err) {
        console.error("Error al cargar trabajadores:", err);
        setTrabajadores([]);
      } finally {
        setLoadingTrabajadores(false);
      }
    };

    fetchTrabajadores();
  }, [sucursalId, enabled, accessToken]);

  return { trabajadores, setTrabajadores, loadingTrabajadores };
}