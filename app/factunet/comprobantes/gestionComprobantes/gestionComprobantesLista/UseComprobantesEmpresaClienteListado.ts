import { useState, useCallback } from "react"
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { ComprobanteListado } from "../Comprobante"

interface UseComprobantesEmpresaClienteListadoParams {
  rucEmpresa: string
  clienteNumDoc: string
  fechaDesde?: string | null
  fechaHasta?: string | null
  limit?: number
  page?: number
}

interface UseComprobantesEmpresaClienteListadoReturn {
  comprobantes: ComprobanteListado[]
  loading: boolean
  error: string | null
  fetchComprobantes: (params: UseComprobantesEmpresaClienteListadoParams) => Promise<ComprobanteListado[]>
  reset: () => void
}

export const useComprobantesEmpresaClienteListado = (): UseComprobantesEmpresaClienteListadoReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [comprobantes, setComprobantes] = useState<ComprobanteListado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComprobantes = useCallback(async ({
    rucEmpresa, clienteNumDoc, fechaDesde, fechaHasta, limit = 100, page = 1
  }: UseComprobantesEmpresaClienteListadoParams): Promise<ComprobanteListado[]> => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/listado/empresa/${rucEmpresa}/cliente/${clienteNumDoc}`
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
      const msg = err instanceof Error ? err.message : "Error al obtener comprobantes"
      setError(msg)
      showToast('Error al obtener comprobantes del cliente', 'error')
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