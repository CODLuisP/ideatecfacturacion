import { useState, useCallback } from "react"
import { useAuth } from '@/context/AuthContext'

interface ActualizarCorreoWhatsappParams {
  comprobanteId: number
  correo?: string | null
  enviadoPorCorreo?: boolean | null
  whatsApp?: string | null
  enviadoPorWhatsApp?: boolean | null
}

interface UseActualizarCorreoWhatsappReturn {
  loading: boolean
  error: string | null
  actualizar: (params: ActualizarCorreoWhatsappParams) => Promise<boolean>
  reset: () => void
}

export const useActualizarCorreoWhatsapp = (): UseActualizarCorreoWhatsappReturn => {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actualizar = useCallback(async ({
    comprobanteId, correo, enviadoPorCorreo, whatsApp, enviadoPorWhatsApp
  }: ActualizarCorreoWhatsappParams): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/actualizar/${comprobanteId}/correo-whatsapp`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            correo,
            enviadoPorCorreo,
            whatsApp,
            enviadoPorWhatsApp
          })
        }
      )
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar")
      return false
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return { loading, error, actualizar, reset }
}