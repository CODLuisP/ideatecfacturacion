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

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

  const fetchSucursal = async () => {
    if (!user?.sucursalID || user?.rol === 'superadmin') return

    setLoadingSucursal(true)

    for (let i = 0; i < 3; i++) {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${user.sucursalID}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        setSucursal(res.data)
        setLoadingSucursal(false)
        return
      } catch {
        if (i < 2) {
          await sleep(1000 * (i + 1))
        } else {
          showToast("Error al obtener la sucursal", "error")
          setLoadingSucursal(false)
        }
      }
    }
  }

  useEffect(() => {
    if (accessToken) fetchSucursal()
  }, [accessToken])

  return { sucursal, loadingSucursal, fetchSucursal }
}