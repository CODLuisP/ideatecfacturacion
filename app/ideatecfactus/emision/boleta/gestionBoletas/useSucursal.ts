import { useState, useEffect } from 'react'
import axios from 'axios'
import { Sucursal } from './Boleta'

export function useSucursal(sucursalId: number) {
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [loadingSucursal, setLoadingSucursal] = useState(false)
  const [errorSucursal, setErrorSucursal] = useState<string | null>(null)

  useEffect(() => {
    if (!sucursalId) return

    const fetch = async () => {
      setLoadingSucursal(true)
      setErrorSucursal(null)
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${sucursalId}`
        )
        setSucursal(res.data)
      } catch (err) {
        setErrorSucursal('Error al obtener la sucursal')
        console.error(err)
      } finally {
        setLoadingSucursal(false)
      }
    }

    fetch()
  }, [sucursalId])

  return { sucursal, loadingSucursal, errorSucursal }
}