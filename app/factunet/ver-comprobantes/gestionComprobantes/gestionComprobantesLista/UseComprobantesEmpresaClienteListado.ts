import { useState, useCallback } from "react"
import { useAuth } from '@/context/AuthContext'
import { ComprobanteListado } from "../Comprobante"

interface UseComprobantesEmpresaClienteListadoParams {
  rucEmpresa: string
  clienteNumDoc: string
  fechaDesde?: string | null
  fechaHasta?: string | null
}

interface UseComprobantesEmpresaClienteListadoReturn {
  comprobantes: ComprobanteListado[]
  loading: boolean
  error: string | null
  fetchComprobantes: (params: UseComprobantesEmpresaClienteListadoParams) => Promise<void>
  reset: () => void
}

export const useComprobantesEmpresaClienteListado = (): UseComprobantesEmpresaClienteListadoReturn => {
  const { accessToken } = useAuth()
  const [comprobantes, setComprobantes] = useState<ComprobanteListado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComprobantes = useCallback(async ({
    rucEmpresa, clienteNumDoc, fechaDesde, fechaHasta,
  }: UseComprobantesEmpresaClienteListadoParams) => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/listado/empresa/${rucEmpresa}/cliente/${clienteNumDoc}`
      )
      if (fechaDesde) url.searchParams.append("fechaDesde", fechaDesde)
      if (fechaHasta) url.searchParams.append("fechaHasta", fechaHasta)

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: ComprobanteListado[] = await response.json()
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