import { useState, useCallback } from "react"
import { Comprobante } from "./Comprobante"
import { useAuth } from '@/context/AuthContext'

interface UseComprobanteUnicoParams {
  ruc: string
  serie: string
  numero: number
}

interface UseComprobanteUnicoReturn {
  comprobante: Comprobante | null
  loading: boolean
  error: string | null
  fetchComprobante: (params: UseComprobanteUnicoParams) => Promise<Comprobante | null> 
  reset: () => void
}

export const useComprobanteUnico = (): UseComprobanteUnicoReturn => {
  const { accessToken } = useAuth()
  const [comprobante, setComprobante] = useState<Comprobante | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

const fetchComprobante = useCallback(async ({ ruc, serie, numero }: UseComprobanteUnicoParams): Promise<Comprobante | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${ruc}/${serie}/${numero}/unico`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: Comprobante = await response.json()
      setComprobante(data)
      return data 
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener comprobante")
      setComprobante(null)
      return null
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