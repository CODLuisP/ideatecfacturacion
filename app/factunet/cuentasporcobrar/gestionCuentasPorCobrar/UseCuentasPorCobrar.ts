import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { CuentaPorCobrar } from './CuentasPorCobrar'

interface Params {
  empresaRuc: string
  establecimientoAnexo?: string | null
  fechaInicio?: string | null
  fechaFin?: string | null
  clienteNumDoc?: string | null
}

interface UseCuentasPorCobrarReturn {
  cuentas: CuentaPorCobrar[]
  loading: boolean
  error: string | null
  fetchCuentas: (params: Params) => Promise<CuentaPorCobrar[]>
  reset: () => void
}

export const useCuentasPorCobrar = (): UseCuentasPorCobrarReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [cuentas, setCuentas] = useState<CuentaPorCobrar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCuentas = useCallback(async ({
    empresaRuc, establecimientoAnexo, fechaInicio, fechaFin, clienteNumDoc
  }: Params): Promise<CuentaPorCobrar[]> => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/CuentasPorCobrar`)
      url.searchParams.append('empresaRuc', empresaRuc)
      if (establecimientoAnexo) url.searchParams.append('establecimientoAnexo', establecimientoAnexo)
      if (fechaInicio) url.searchParams.append('fechaInicio', fechaInicio)
      if (fechaFin) url.searchParams.append('fechaFin', fechaFin)
      if (clienteNumDoc) url.searchParams.append('clienteNumDoc', clienteNumDoc)

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: CuentaPorCobrar[] = await response.json()
      setCuentas(data)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al obtener cuentas por cobrar'
      setError(msg)
      showToast('Error al cargar las cuentas por cobrar', 'error')
      setCuentas([])
      return []
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setCuentas([])
    setError(null)
    setLoading(false)
  }, [])

  return { cuentas, loading, error, fetchCuentas, reset }
}