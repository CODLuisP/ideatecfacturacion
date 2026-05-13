import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { CuotaPago } from './CuentasPorCobrar'

interface UseHistorialPagosReturn {
  historial: CuotaPago[]
  loading: boolean
  error: string | null
  fetchHistorial: (cuotaId: number) => Promise<CuotaPago[]>
  reset: () => void
}

export const useHistorialPagos = (): UseHistorialPagosReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [historial, setHistorial] = useState<CuotaPago[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistorial = useCallback(async (cuotaId: number): Promise<CuotaPago[]> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/CuentasPorCobrar/cuotas/${cuotaId}/historial`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: CuotaPago[] = await response.json()
      setHistorial(data)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al obtener historial'
      setError(msg)
      showToast('Error al cargar el historial de pagos', 'error')
      setHistorial([])
      return []
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setHistorial([])
    setError(null)
    setLoading(false)
  }, [])

  return { historial, loading, error, fetchHistorial, reset }
}