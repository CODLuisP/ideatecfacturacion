import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { RegistrarPagoDeudaPayload } from './DeudaContado'

interface UseRegistrarPagoDeudaReturn {
  loading: boolean
  error: string | null
  registrarPago: (pagoId: number, payload: RegistrarPagoDeudaPayload) => Promise<boolean>
  reset: () => void
}

export const useRegistrarPagoDeuda = (): UseRegistrarPagoDeudaReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registrarPago = useCallback(async (
    pagoId: number,
    payload: RegistrarPagoDeudaPayload
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/DeudaContado/${pagoId}/pagar`,
        {
          method: 'POST',
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

  return { loading, error, registrarPago, reset }
}