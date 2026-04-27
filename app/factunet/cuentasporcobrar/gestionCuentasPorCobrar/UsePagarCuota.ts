import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { PagarCuotaPayload } from './CuentasPorCobrar'

interface UsePagarCuotaReturn {
  loading: boolean
  error: string | null
  pagarCuota: (cuotaId: number, payload: PagarCuotaPayload) => Promise<boolean>
  reset: () => void
}

export const usePagarCuota = (): UsePagarCuotaReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pagarCuota = useCallback(async (
    cuotaId: number,
    payload: PagarCuotaPayload
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/CuentasPorCobrar/cuotas/${cuotaId}/pagar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload)
        }
      )
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      showToast('Pago registrado correctamente', 'success')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el pago'
      setError(msg)
      showToast('Error al registrar el pago', 'error')
      return false
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return { loading, error, pagarCuota, reset }
}