import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { EditarPagoDeudaPayload } from './DeudaContado'

interface UseGestionHistorialDeudaReturn {
  loadingEditar: boolean
  loadingEliminar: boolean
  editarPago: (pagoId: number, deudaPagoId: number, payload: EditarPagoDeudaPayload) => Promise<boolean>
  eliminarPago: (pagoId: number, deudaPagoId: number) => Promise<boolean>
}

export const useGestionHistorialDeuda = (): UseGestionHistorialDeudaReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()

  const [loadingEditar, setLoadingEditar] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)

  const editarPago = useCallback(async (
    pagoId: number,
    deudaPagoId: number,
    payload: EditarPagoDeudaPayload
  ): Promise<boolean> => {
    setLoadingEditar(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/DeudaContado/${pagoId}/historial/${deudaPagoId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.message ?? `Error ${response.status}`)
      }

      showToast('Pago actualizado correctamente', 'success')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al editar el pago'
      showToast(msg, 'error')
      return false
    } finally {
      setLoadingEditar(false)
    }
  }, [accessToken])

  const eliminarPago = useCallback(async (
    pagoId: number,
    deudaPagoId: number
  ): Promise<boolean> => {
    setLoadingEliminar(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/DeudaContado/${pagoId}/historial/${deudaPagoId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.message ?? `Error ${response.status}`)
      }

      showToast('Pago eliminado correctamente', 'success')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el pago'
      showToast(msg, 'error')
      return false
    } finally {
      setLoadingEliminar(false)
    }
  }, [accessToken])

  return { loadingEditar, loadingEliminar, editarPago, eliminarPago }
}