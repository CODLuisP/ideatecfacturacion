import { useState, useCallback } from "react"
import { Comprobante } from "./Comprobante"
import { useAuth } from '@/context/AuthContext'

interface UseComprobantesEmpresaUsuarioParams {
  rucEmpresa: string
  usuarioId: number
  fechaDesde?: string | null
  fechaHasta?: string | null
}

interface UseComprobantesEmpresaUsuarioReturn {
  comprobantes: Comprobante[]
  loading: boolean
  error: string | null
  fetchComprobantes: (params: UseComprobantesEmpresaUsuarioParams) => Promise<void>
  reset: () => void
}

export const useComprobantesEmpresaUsuario = (): UseComprobantesEmpresaUsuarioReturn => {
  const { accessToken } = useAuth()
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComprobantes = useCallback(async ({
    rucEmpresa, usuarioId, fechaDesde, fechaHasta,
  }: UseComprobantesEmpresaUsuarioParams) => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/empresa/${rucEmpresa}/usuario/${usuarioId}`
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