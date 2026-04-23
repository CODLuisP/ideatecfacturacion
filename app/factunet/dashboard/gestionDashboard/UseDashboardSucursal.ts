import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { DashboardData } from './Dashboard'

interface UseDashboardSucursalParams {
  sucursalId: number
  desde?: string | null
  hasta?: string | null
  limite?: number
}

interface UseDashboardSucursalReturn {
  dashboard: DashboardData | null
  loading: boolean
  error: string | null
  fetchDashboard: (params: UseDashboardSucursalParams) => Promise<DashboardData | null>
  reset: () => void
}

export const useDashboardSucursal = (): UseDashboardSucursalReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async ({
    sucursalId, desde, hasta, limite = 10
  }: UseDashboardSucursalParams): Promise<DashboardData | null> => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/Dashboard/sucursal/${sucursalId}`)
      if (desde) url.searchParams.append('desde', desde)
      if (hasta) url.searchParams.append('hasta', hasta)
      url.searchParams.append('limite', String(limite))

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data: DashboardData = await response.json()
      setDashboard(data)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al obtener el dashboard'
      setError(msg)
      showToast('Error al obtener el dashboard de sucursal', 'error')
      setDashboard(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setDashboard(null)
    setError(null)
    setLoading(false)
  }, [])

  return { dashboard, loading, error, fetchDashboard, reset }
}