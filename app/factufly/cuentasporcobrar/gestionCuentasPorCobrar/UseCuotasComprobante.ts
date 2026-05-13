import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { Cuota } from './CuentasPorCobrar'

interface UseCuotasComprobanteReturn {
  cuotas: Cuota[]
  loading: boolean
  error: string | null
  fetchCuotas: (comprobanteId: number) => Promise<Cuota[]>
  reset: () => void
}

export const useCuotasComprobante = (): UseCuotasComprobanteReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCuotas = useCallback(async (comprobanteId: number): Promise<Cuota[]> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/CuentasPorCobrar/${comprobanteId}/cuotas`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: Cuota[] = await response.json()
      setCuotas(data)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al obtener cuotas'
      setError(msg)
      showToast('Error al cargar las cuotas', 'error')
      setCuotas([])
      return []
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setCuotas([])
    setError(null)
    setLoading(false)
  }, [])

  return { cuotas, loading, error, fetchCuotas, reset }
}