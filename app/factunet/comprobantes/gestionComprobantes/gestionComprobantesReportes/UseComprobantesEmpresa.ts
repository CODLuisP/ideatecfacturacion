import { useState, useCallback } from "react"
import { Comprobante } from "../Comprobante"
import { useAuth } from '@/context/AuthContext'

interface UseComprobantesEmpresaParams {
  ruc: string
  fechaDesde?: string | null
  fechaHasta?: string | null
}

interface UseComprobantesEmpresaReturn {
  comprobantes: Comprobante[]
  loading: boolean
  error: string | null
  fetchComprobantes: (params: UseComprobantesEmpresaParams) => Promise<void>
  reset: () => void
}

export const useComprobantesEmpresa = (): UseComprobantesEmpresaReturn => {
  const { accessToken } = useAuth()
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComprobantes = useCallback(async ({
    ruc, fechaDesde, fechaHasta,
  }: UseComprobantesEmpresaParams) => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/ruc/${ruc}`)
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