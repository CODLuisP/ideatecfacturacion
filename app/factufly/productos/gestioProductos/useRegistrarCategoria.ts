import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'


export function useRegistrarCategoria(onCategoriaAgregada?: () => void) {
  const { accessToken, user } = useAuth()
  const { showToast } = useToast()
  const [loadingRegistrar, setLoadingRegistrar] = useState(false)

  const registrarCategoria = async (dto: { categoriaNombre: string; descripcion?: string }) => {
    setLoadingRegistrar(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Categorias`,
        { ...dto, empresaRuc: user?.ruc },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      showToast('Categoría registrada correctamente.', 'success')
      onCategoriaAgregada?.()  // ← solo notifica, no pasa objeto
      return true
    } catch {
      showToast('Error al registrar la categoría.', 'error')
      return false
    } finally {
      setLoadingRegistrar(false)
    }
  }

  return { registrarCategoria, loadingRegistrar }
}