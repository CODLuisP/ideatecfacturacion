import { useState, useCallback } from "react"
import { ComprobanteListado } from "../Comprobante"
import { useAuth } from '@/context/AuthContext'

interface UseComprobantesClienteSucursalListadoParams {
  sucursalId: number
  clienteNumDoc: string
  fechaDesde?: string | null
  fechaHasta?: string | null
  limit?: number
  offset?: number
}

interface UseComprobantesClienteSucursalListadoReturn {
  comprobantes: ComprobanteListado[]
  loading: boolean
  error: string | null
  hasMore: boolean
  fetchComprobantes: (params: UseComprobantesClienteSucursalListadoParams) => Promise<ComprobanteListado[]>
  reset: () => void
}

export const useComprobantesClienteSucursalListado = (): UseComprobantesClienteSucursalListadoReturn => {
  const { accessToken } = useAuth()
  const [comprobantes, setComprobantes] = useState<ComprobanteListado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchComprobantes = useCallback(async ({
    sucursalId, clienteNumDoc, fechaDesde, fechaHasta, limit = 100, offset = 0
  }: UseComprobantesClienteSucursalListadoParams): Promise<ComprobanteListado[]> => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/listado/sucursal/${sucursalId}/cliente/${clienteNumDoc}`
      )
      if (fechaDesde) url.searchParams.append("fechaDesde", fechaDesde)
      if (fechaHasta) url.searchParams.append("fechaHasta", fechaHasta)
      url.searchParams.append("limit", limit.toString()) 
      url.searchParams.append("offset", offset.toString()) 

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: ComprobanteListado[] = await response.json()
      
      setComprobantes(data)
      setHasMore(data.length === limit)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener comprobantes")
      setComprobantes([])
      setHasMore(false)
      return []
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setComprobantes([])
    setError(null)
    setLoading(false)
    setHasMore(true)
  }, [])

  return { comprobantes, loading, error, hasMore, fetchComprobantes, reset }
}