import { useState, useCallback } from "react"
import { ComprobanteListado } from "../Comprobante"
import { useAuth } from '@/context/AuthContext'

interface UseComprobantesClienteSucursalListadoParams {
  sucursalId: number
  clienteNumDoc: string
  fechaDesde?: string | null
  fechaHasta?: string | null
  limit?: number
  page?: number
}

interface UseComprobantesClienteSucursalListadoReturn {
  comprobantes: ComprobanteListado[]
  loading: boolean
  error: string | null
  fetchComprobantes: (params: UseComprobantesClienteSucursalListadoParams) => Promise<ComprobanteListado[]>
  reset: () => void
}

export const useComprobantesClienteSucursalListado = (): UseComprobantesClienteSucursalListadoReturn => {
  const { accessToken } = useAuth()
  const [comprobantes, setComprobantes] = useState<ComprobanteListado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComprobantes = useCallback(async ({
    sucursalId, clienteNumDoc, fechaDesde, fechaHasta, limit = 100, page = 1
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
      url.searchParams.append("page", page.toString()) 

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: ComprobanteListado[] = await response.json()
      setComprobantes(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener comprobantes")
      setComprobantes([])
      return []
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