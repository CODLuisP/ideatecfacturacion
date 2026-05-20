import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { PagoDeudaContado } from './DeudaContado'

interface UseHistorialDeudaContadoReturn {
  historial: PagoDeudaContado[]
  loading: boolean
  error: string | null
  fetchHistorial: (pagoId: number) => Promise<PagoDeudaContado[]>
  reset: () => void
}

export const useHistorialDeudaContado = (): UseHistorialDeudaContadoReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [historial, setHistorial] = useState<PagoDeudaContado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistorial = useCallback(async (pagoId: number): Promise<PagoDeudaContado[]> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/DeudaContado/${pagoId}/historial`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (response.status === 404) return [];
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: PagoDeudaContado[] = await response.json()
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