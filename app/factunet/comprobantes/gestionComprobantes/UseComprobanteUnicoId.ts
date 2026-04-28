import { useState, useCallback } from "react"
import { Comprobante } from "./Comprobante"
import { useAuth } from '@/context/AuthContext'

interface UseComprobanteUnicoIdReturn {
  comprobante: Comprobante | null
  loading: boolean
  error: string | null
  fetchComprobante: (id: number) => Promise<void>
  reset: () => void
}

export const useComprobanteUnicoId = (): UseComprobanteUnicoIdReturn => {
  const { accessToken } = useAuth()
  const [comprobante, setComprobante] = useState<Comprobante | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComprobante = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: Comprobante = await response.json()
      setComprobante(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener comprobante")
      setComprobante(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setComprobante(null)
    setError(null)
    setLoading(false)
  }, [])

  return { comprobante, loading, error, fetchComprobante, reset }
}