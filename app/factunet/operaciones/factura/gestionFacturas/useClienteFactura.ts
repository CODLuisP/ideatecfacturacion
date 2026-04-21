import { useState } from 'react'
import { FacturaCliente } from './Factura'

export function useClienteFactura() {
  const [cliente, setCliente] = useState<Partial<FacturaCliente> | null>(null)
  const [loadingCliente, setLoadingCliente] = useState(false)
  const [errorCliente, setErrorCliente] = useState<string | null>(null)

  const buscarCliente = async (tipoDoc: string, numeroDoc: string) => {
    if (!numeroDoc) return
    // Solo se permite RUC (06) o CE (04)
    if (tipoDoc !== '06' && tipoDoc !== '04') return

    setLoadingCliente(true)
    setErrorCliente(null)

    try {
      if (tipoDoc === '06') {
        // RUC
        const res = await fetch(
          `https://dniruc.apisperu.com/api/v1/ruc/${numeroDoc}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImVzbHVpc2NhYnJlcmEyMEBnbWFpbC5jb20ifQ.6itYzECdbiU5iZ8loM3Os1kdGrX-dXXOmdrMnYVo2no`
        )
        const data = await res.json()
        if (data.ruc) {
          setCliente({
            clienteId: null,
            tipoDocumento: tipoDoc,
            numeroDocumento: numeroDoc,
            razonSocial: data.razonSocial ?? '',
            ubigeo: data.ubigeo ?? '',
            direccionLineal: data.direccion ?? '',
            departamento: data.departamento ?? '',
            provincia: data.provincia ?? '',
            distrito: data.distrito ?? '',
          })
        } else {
          setErrorCliente('RUC no encontrado')
        }
      } else if (tipoDoc === '04') {
        // Carnet de extranjería — no hay API pública, se crea con datos vacíos
        setCliente({
          clienteId: null,
          tipoDocumento: tipoDoc,
          numeroDocumento: numeroDoc,
          razonSocial: '',
          ubigeo: '',
          direccionLineal: '',
          departamento: '',
          provincia: '',
          distrito: '',
        })
      }
    } catch {
      setErrorCliente('No se pudo encontrar el cliente')
    } finally {
      setLoadingCliente(false)
    }
  }

  return { cliente, loadingCliente, errorCliente, buscarCliente, setCliente }
}