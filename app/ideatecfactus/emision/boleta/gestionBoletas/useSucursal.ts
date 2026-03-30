import { useState, useEffect } from 'react'
import axios from 'axios'
import { Sucursal } from './Boleta'
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/app/components/ui/Toast';

export function useSucursal() {
  const { showToast } = useToast();
  const { accessToken, user } = useAuth();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [loadingSucursal, setLoadingSucursal] = useState(false)

  const fetchSucursal = async () => {
    setLoadingSucursal(true)
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${user?.sucursalID}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      setSucursal(res.data)
    } catch {
      showToast("Error al obtener la sucursal", "error");
    } finally {
      setLoadingSucursal(false)
    }
  }

  useEffect(() => {
    if (accessToken) fetchSucursal()
  }, [accessToken])

  return { sucursal, loadingSucursal, fetchSucursal }
}