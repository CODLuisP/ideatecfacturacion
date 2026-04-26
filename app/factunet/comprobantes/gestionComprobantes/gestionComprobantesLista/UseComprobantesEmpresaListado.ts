import { useState, useCallback } from "react"
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { ComprobanteListado } from "../Comprobante"

interface UseComprobantesEmpresaListadoParams {
  ruc: string
  fechaDesde?: string | null
  fechaHasta?: string | null
}

interface UseComprobantesEmpresaListadoReturn {
  comprobantes: ComprobanteListado[]
  loading: boolean
  error: string | null
  fetchComprobantes: (params: UseComprobantesEmpresaListadoParams) => Promise<ComprobanteListado[]>
  reset: () => void
}

export const useComprobantesEmpresaListado = (): UseComprobantesEmpresaListadoReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [comprobantes, setComprobantes] = useState<ComprobanteListado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComprobantes = useCallback(async ({
    ruc, fechaDesde, fechaHasta,
  }: UseComprobantesEmpresaListadoParams): Promise<ComprobanteListado[]> => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/listado/ruc/${ruc}`)
      if (fechaDesde) url.searchParams.append("fechaDesde", fechaDesde)
      if (fechaHasta) url.searchParams.append("fechaHasta", fechaHasta)
      url.searchParams.append("limit", "200") 

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: ComprobanteListado[] = await response.json()
      setComprobantes(data)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al obtener comprobantes"
      setError(msg)
      showToast('Error al obtener comprobantes de la empresa', 'error')
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