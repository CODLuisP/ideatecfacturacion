import { useState, useCallback } from "react"
import { useAuth } from '@/context/AuthContext'
import { Comprobante } from "../Comprobante"

interface UseComprobantesSucursalParams {
  sucursalId: number
  fechaDesde?: string | null
  fechaHasta?: string | null
}

interface UseComprobantesSucursalReturn {
  comprobantes: Comprobante[]
  loading: boolean
  error: string | null
  fetchComprobantes: (params: UseComprobantesSucursalParams) => Promise<void>
  reset: () => void
}

export const useComprobantesSucursal = (): UseComprobantesSucursalReturn => {
  const { accessToken } = useAuth()
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComprobantes = useCallback(async ({
    sucursalId,
    fechaDesde,
    fechaHasta,
  }: UseComprobantesSucursalParams) => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/sucursal/${sucursalId}`)
      if (fechaDesde) url.searchParams.append("fechaDesde", fechaDesde)
      if (fechaHasta) url.searchParams.append("fechaHasta", fechaHasta)

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: Comprobante[] = await response.json()
      setComprobantes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener comprobantes")
      setComprobantes([])
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setComprobantes([])
    setError(null)
    setLoading(false)
  }, [])

  return { comprobantes, loading, error, fetchComprobantes, reset }
}