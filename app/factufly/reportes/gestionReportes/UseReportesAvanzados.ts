import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/app/components/ui/Toast'
import {
  MedioPagoTop,
  ProductoTop,
  ListadoReporte,
  ReportesAvanzadosParams,
  Periodo
} from './Reportes'

interface UseReportesAvanzadosReturn {
  listado: ListadoReporte[]
  productosTop: ProductoTop[]
  mediosPago: MedioPagoTop[]
  loadingListado: boolean
  loadingProductos: boolean
  loadingMedios: boolean
  loadingExcelListado: boolean
  loadingExcelProductos: boolean
  loadingExcelMedios: boolean
  loadingExcelControlCaja: boolean
  fetchListado: (params: ReportesAvanzadosParams) => Promise<void>
  fetchProductosTop: (params: ReportesAvanzadosParams) => Promise<void>
  fetchMediosPago: (params: ReportesAvanzadosParams) => Promise<void>
  descargarExcelListado: (params: ReportesAvanzadosParams, titulo: string) => Promise<void>
  descargarExcelProductos: (params: ReportesAvanzadosParams, titulo: string) => Promise<void>
  descargarExcelMedios: (params: ReportesAvanzadosParams, titulo: string) => Promise<void>
  descargarExcelControlCaja: (params: ReportesAvanzadosParams, titulo: string) => Promise<void>
}

export const useReportesAvanzados = (): UseReportesAvanzadosReturn => {
  const { accessToken } = useAuth()
  const { showToast } = useToast()

  const [listado, setListado] = useState<ListadoReporte[]>([])
  const [productosTop, setProductosTop] = useState<ProductoTop[]>([])
  const [mediosPago, setMediosPago] = useState<MedioPagoTop[]>([])

  const [loadingListado, setLoadingListado] = useState(false)
  const [loadingProductos, setLoadingProductos] = useState(false)
  const [loadingMedios, setLoadingMedios] = useState(false)
  const [loadingExcelListado, setLoadingExcelListado] = useState(false)
  const [loadingExcelProductos, setLoadingExcelProductos] = useState(false)
  const [loadingExcelMedios, setLoadingExcelMedios] = useState(false)
  const [loadingExcelControlCaja, setLoadingExcelControlCaja] = useState(false)

  const buildUrl = (path: string, params: Record<string, string | number | null | undefined>) => {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}${path}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '')
        url.searchParams.append(key, String(value))
    })
    return url.toString()
  }

  const headers = { Authorization: `Bearer ${accessToken}` }

  // ── Listado comprobantes ───────────────────────────────────────────────────
  const fetchListado = useCallback(async (params: ReportesAvanzadosParams) => {
    setLoadingListado(true)
    try {
      const url = buildUrl(`/api/Reportes/listado/${params.ruc}`, {
        codEstablecimiento: params.codEstablecimiento,
        fechaDesde:         params.fechaDesde,
        fechaHasta:         params.fechaHasta,
        usuarioCreacion:    params.usuarioCreacion,
        clienteNumDoc:      params.clienteNumDoc,
        limit:              params.limit,
      })
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setListado(await res.json())
    } catch {
      showToast('Error al obtener listado de comprobantes', 'error')
      setListado([])
    } finally {
      setLoadingListado(false)
    }
  }, [accessToken])

  // ── Productos top ──────────────────────────────────────────────────────────
  const fetchProductosTop = useCallback(async (params: ReportesAvanzadosParams) => {
    setLoadingProductos(true)
    try {
      const url = buildUrl(`/api/Reportes/productos-top/${params.ruc}`, {
        codEstablecimiento: params.codEstablecimiento,
        fechaDesde:         params.fechaDesde,
        fechaHasta:         params.fechaHasta,
        usuarioCreacion:    params.usuarioCreacion,
        clienteNumDoc:      params.clienteNumDoc,
        limit:              params.limit,
        orderBy:            params.orderBy,
      })
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setProductosTop(await res.json())
    } catch {
      showToast('Error al obtener productos top', 'error')
      setProductosTop([])
    } finally {
      setLoadingProductos(false)
    }
  }, [accessToken])

  // ── Medios de pago ─────────────────────────────────────────────────────────
  const fetchMediosPago = useCallback(async (params: ReportesAvanzadosParams) => {
    setLoadingMedios(true)
    try {
      const url = buildUrl(`/api/Reportes/medios-pago/${params.ruc}`, {
        codEstablecimiento: params.codEstablecimiento,
        fechaDesde:         params.fechaDesde,
        fechaHasta:         params.fechaHasta,
        usuarioCreacion:    params.usuarioCreacion,
        clienteNumDoc:      params.clienteNumDoc,
        limit:              params.limit,
      })
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setMediosPago(await res.json())
    } catch {
      showToast('Error al obtener medios de pago', 'error')
      setMediosPago([])
    } finally {
      setLoadingMedios(false)
    }
  }, [accessToken])

  // ── Control de caja ─────────────────────────────────────────────────────────
  const descargarExcelControlCaja = useCallback(async (
    params: ReportesAvanzadosParams,
    titulo: string
  ) => {
    setLoadingExcelControlCaja(true)
    try {
      const url = buildUrl(`/api/Reportes/control-caja/${params.ruc}/excel`, {
        titulo,
        codEstablecimiento: params.codEstablecimiento,
        fechaDesde:         params.fechaDesde,
        fechaHasta:         params.fechaHasta,
        usuarioCreacion:    params.usuarioCreacion,
        clienteNumDoc:      params.clienteNumDoc,
        limit:              params.limit,
      })
      await descargarBlob(url, titulo)
      showToast('Excel descargado correctamente', 'success')
    } catch {
      showToast('Error al generar el Excel', 'error')
    } finally {
      setLoadingExcelControlCaja(false)
    }
  }, [accessToken])

  // ── Excel helpers ──────────────────────────────────────────────────────────
  const descargarBlob = async (url: string, nombreArchivo: string) => {
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`Error ${res.status}`)
    const blob = await res.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${nombreArchivo}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // ── Excel listado ──────────────────────────────────────────────────────────
  const descargarExcelListado = useCallback(async (
    params: ReportesAvanzadosParams,
    titulo: string
  ) => {
    setLoadingExcelListado(true)
    try {
      const url = buildUrl(`/api/Reportes/listado/${params.ruc}/excel`, {
        titulo:             titulo,
        codEstablecimiento: params.codEstablecimiento,
        fechaDesde:         params.fechaDesde,
        fechaHasta:         params.fechaHasta,
        usuarioCreacion:    params.usuarioCreacion,
        clienteNumDoc:      params.clienteNumDoc,
        limit:              params.limit,
      })
      await descargarBlob(url, titulo)
      showToast('Excel descargado correctamente', 'success')
    } catch {
      showToast('Error al generar el Excel', 'error')
    } finally {
      setLoadingExcelListado(false)
    }
  }, [accessToken])

  // ── Excel productos top ────────────────────────────────────────────────────
  const descargarExcelProductos = useCallback(async (
    params: ReportesAvanzadosParams,
    titulo: string
  ) => {
    setLoadingExcelProductos(true)
    try {
      const url = buildUrl(`/api/Reportes/productos-top/${params.ruc}/excel`, {
        titulo:             titulo,
        codEstablecimiento: params.codEstablecimiento,
        fechaDesde:         params.fechaDesde,
        fechaHasta:         params.fechaHasta,
        usuarioCreacion:    params.usuarioCreacion,
        clienteNumDoc:      params.clienteNumDoc,
        limit:              params.limit,
        orderBy:            params.orderBy,
      })
      await descargarBlob(url, titulo)
      showToast('Excel descargado correctamente', 'success')
    } catch {
      showToast('Error al generar el Excel', 'error')
    } finally {
      setLoadingExcelProductos(false)
    }
  }, [accessToken])

  // ── Excel medios pago ──────────────────────────────────────────────────────
  const descargarExcelMedios = useCallback(async (
    params: ReportesAvanzadosParams,
    titulo: string
  ) => {
    setLoadingExcelMedios(true)
    try {
      const url = buildUrl(`/api/Reportes/medios-pago/${params.ruc}/excel`, {
        titulo:             titulo,
        codEstablecimiento: params.codEstablecimiento,
        fechaDesde:         params.fechaDesde,
        fechaHasta:         params.fechaHasta,
        usuarioCreacion:    params.usuarioCreacion,
        clienteNumDoc:      params.clienteNumDoc,
        limit:              params.limit,
      })
      await descargarBlob(url, titulo)
      showToast('Excel descargado correctamente', 'success')
    } catch {
      showToast('Error al generar el Excel', 'error')
    } finally {
      setLoadingExcelMedios(false)
    }
  }, [accessToken])

  return {
    listado, productosTop, mediosPago,
    loadingListado, loadingProductos, loadingMedios,
    loadingExcelListado, loadingExcelProductos, loadingExcelMedios,
    fetchListado, fetchProductosTop, fetchMediosPago,
    descargarExcelListado, descargarExcelProductos, descargarExcelMedios,
    loadingExcelControlCaja, descargarExcelControlCaja,
  }
}