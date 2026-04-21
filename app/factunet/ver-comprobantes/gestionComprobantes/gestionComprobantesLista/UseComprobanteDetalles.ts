import { useState, useCallback } from "react"
import { useAuth } from '@/context/AuthContext'
import { ComprobanteDetalles } from "../Comprobante"

interface UseComprobanteDetallesReturn {
  detalles: ComprobanteDetalles | null
  loading: boolean
  error: string | null
  fetchDetalles: (comprobanteId: number) => Promise<void>
  reset: () => void
}

export const useComprobanteDetalles = (): UseComprobanteDetallesReturn => {
  const { accessToken } = useAuth()
  const [detalles, setDetalles] = useState<ComprobanteDetalles | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetalles = useCallback(async (comprobanteId: number) => {
    setLoading(true)
    setError(null)
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobanteId}/detalles`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: ComprobanteDetalles = await response.json()
      setDetalles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener detalles")
      setDetalles(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setDetalles(null)
    setError(null)
    setLoading(false)
  }, [])

  return { detalles, loading, error, fetchDetalles, reset }
}