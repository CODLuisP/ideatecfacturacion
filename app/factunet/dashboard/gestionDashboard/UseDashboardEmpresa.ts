import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { DashboardData } from './Dashboard'

interface UseDashboardEmpresaParams {
  ruc: string
  fecha?: string | null
  limite?: number
}

interface UseDashboardEmpresaReturn {
  dashboard: DashboardData | null
  loading: boolean
  error: string | null
  fetchDashboard: (params: UseDashboardEmpresaParams) => Promise<DashboardData | null>
  reset: () => void
}

export const useDashboardEmpresa = (): UseDashboardEmpresaReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async ({
    ruc, fecha, limite = 10
  }: UseDashboardEmpresaParams): Promise<DashboardData | null> => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/Dashboard/empresa/${ruc}`)
      if (fecha) url.searchParams.append('fecha', fecha)
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
      showToast('Error al obtener el dashboard', 'error')
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