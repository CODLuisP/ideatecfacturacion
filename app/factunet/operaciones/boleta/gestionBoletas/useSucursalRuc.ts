import { useState, useEffect } from 'react'
import axios from 'axios'
import { Sucursal } from './Boleta'
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/app/components/ui/Toast';

export function useSucursalRuc( enabled: boolean = true ) {
  const { showToast } = useToast();
  const { accessToken, user } = useAuth();
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loadingSucursales, setLoadingSucursales] = useState(false)

  const fetchSucursales = async () => {
    setLoadingSucursales(true)
    try {
        const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal`,
        {
          params: { ruc: user?.ruc },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      setSucursales(res.data)
    } catch {
      showToast("Error al obtener las sucursales", "error");
    } finally {
      setLoadingSucursales(false)
    }
  }

  useEffect(() => {
    if (accessToken && enabled) fetchSucursales()
  }, [accessToken, enabled])

  return { sucursales, loadingSucursales, fetchSucursales }
}