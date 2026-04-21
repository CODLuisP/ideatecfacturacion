import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import { ComprobanteObtenido } from './Obtenercomprobante'

interface UseComprobanteRucSerieCorrelativoReturn {
  comprobante: ComprobanteObtenido | null
  loadingComprobante: boolean
  errorComprobante: string | null
  buscarComprobante: (serie: string, correlativo: string) => Promise<ComprobanteObtenido | null>
  limpiarComprobante: () => void
}

export function useComprobanteRucSerieCorrelativo(): UseComprobanteRucSerieCorrelativoReturn {
  const { accessToken, user } = useAuth()
  const { showToast } = useToast()

  const [comprobante, setComprobante] = useState<ComprobanteObtenido | null>(null)
  const [loadingComprobante, setLoadingComprobante] = useState(false)
  const [errorComprobante, setErrorComprobante] = useState<string | null>(null)

  const buscarComprobante = async (
    serie: string,
    correlativo: string,
  ): Promise<ComprobanteObtenido | null> => {
    const ruc = user?.ruc
    if (!ruc) {
      showToast('No se encontró el RUC de la empresa', 'error')
      return null
    }
    if (!serie.trim() || !correlativo.trim()) {
      showToast('Ingrese serie y correlativo', 'error')
      return null
    }

    setLoadingComprobante(true)
    setErrorComprobante(null)
    setComprobante(null)

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${ruc}/${serie.trim()}/${correlativo.trim()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      const data: ComprobanteObtenido = res.data

      // Validar que el comprobante esté aceptado por SUNAT
      if (data.estadoSunat !== 'ACEPTADO') {
        const msg = `El comprobante no está aceptado por SUNAT (estado: ${data.estadoSunat})`
        setErrorComprobante(msg)
        showToast(msg, 'error')
        return null
      }

      setComprobante(data)
      return data
    } catch (err: any) {
      const msg =
        err?.response?.status === 404
          ? 'Comprobante no encontrado'
          : (err?.response?.data?.mensaje ?? err?.response?.data?.message ?? 'Error al buscar el comprobante')
      setErrorComprobante(msg)
      showToast(msg, 'error')
      return null
    } finally {
      setLoadingComprobante(false)
    }
  }

  const limpiarComprobante = () => {
    setComprobante(null)
    setErrorComprobante(null)
  }

  return {
    comprobante,
    loadingComprobante,
    errorComprobante,
    buscarComprobante,
    limpiarComprobante,
  }
}