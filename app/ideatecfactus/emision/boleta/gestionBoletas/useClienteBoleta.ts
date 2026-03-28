import { useState } from 'react'
import axios from 'axios'
import { BoletaCliente } from './Boleta'

export function useClienteBoleta() {
  const [cliente, setCliente] = useState<Partial<BoletaCliente> | null>(null)
  const [loadingCliente, setLoadingCliente] = useState(false)
  const [errorCliente, setErrorCliente] = useState<string | null>(null)

  const buscarCliente = async ( tipoDoc: string, numeroDoc: string) => {
    if (!numeroDoc) return
    setLoadingCliente(true)
    setErrorCliente(null)

    try {
      // 2. Si no está en BD, buscar en API SUNAT según tipo doc
      if (tipoDoc === '01') {
        // DNI
        const res = await fetch(
          `https://dniruc.apisperu.com/api/v1/dni/${numeroDoc}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImVzbHVpc2NhYnJlcmEyMEBnbWFpbC5jb20ifQ.6itYzECdbiU5iZ8loM3Os1kdGrX-dXXOmdrMnYVo2no`
        )
        const data = await res.json()
        if (data.success) {
          setCliente({
            clienteId: null,
            tipoDocumento: tipoDoc,
            numeroDocumento: numeroDoc,
            razonSocial: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`,
            ubigeo: '',
            direccionLineal: '',
            departamento: '',
            provincia: '',
            distrito: '',
          })
        }
      } else if (tipoDoc === '06') {
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
        }
      }
    } catch {
      setErrorCliente('No se pudo encontrar el cliente')
    } finally {
      setLoadingCliente(false)
    }
  }

  return { cliente, loadingCliente, errorCliente, buscarCliente }
}