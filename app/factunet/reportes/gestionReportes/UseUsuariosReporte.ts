// factunet/reportes/gestionReportes/UseUsuariosReporte.ts

import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'

export interface UsuarioReporte {
  usuarioID: number
  username: string
  rol: string
  sucursalID: string | null
  email: string
  ruc: string
}

interface UseUsuariosReporteReturn {
  usuarios: UsuarioReporte[]
  loading: boolean
  fetchUsuarios: () => Promise<void>
}

export const useUsuariosReporte = (): UseUsuariosReporteReturn => {
  const { accessToken, user } = useAuth()
  const { showToast } = useToast()

  const [usuarios, setUsuarios] = useState<UsuarioReporte[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsuarios = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const isSuperAdmin = user.rol === 'superadmin'
      const isAdmin      = user.rol === 'admin'

      // Solo admin y superadmin pueden ver esto
      if (!isSuperAdmin && !isAdmin) return

      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/usuario/por-ruc`)
      url.searchParams.append('ruc', user.ruc)

      // superadmin → sin sucursalID (ve todos)
      // admin      → con su sucursalID (ve solo su sucursal)
      if (isAdmin && user.sucursalID) {
        url.searchParams.append('sucursalID', String(user.sucursalID))
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (!response.ok) throw new Error(`Error ${response.status}`)

      const json = await response.json()
      setUsuarios(json.data ?? [])
    } catch {
      showToast('Error al cargar usuarios', 'error')
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }, [accessToken, user])

  return { usuarios, loading, fetchUsuarios }
}