import { useState, useCallback } from "react"
import { Comprobante } from "./Comprobante"
import { useAuth } from '@/context/AuthContext'

interface UseComprobantesEmpresaClienteParams {
  rucEmpresa: string
  clienteNumDoc: string
  fechaDesde?: string | null
  fechaHasta?: string | null
}

interface UseComprobantesEmpresaClienteReturn {
  comprobantes: Comprobante[]
  loading: boolean
  error: string | null
  fetchComprobantes: (params: UseComprobantesEmpresaClienteParams) => Promise<void>
  reset: () => void
}

export const useComprobantesEmpresaCliente = (): UseComprobantesEmpresaClienteReturn => {
  const { accessToken } = useAuth()
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComprobantes = useCallback(async ({
    rucEmpresa, clienteNumDoc, fechaDesde, fechaHasta,
  }: UseComprobantesEmpresaClienteParams) => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/empresa/${rucEmpresa}/cliente/${clienteNumDoc}`
      )
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