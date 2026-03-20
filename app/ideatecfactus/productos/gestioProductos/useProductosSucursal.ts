import { useState, useEffect } from 'react'
import axios from 'axios'
import { ProductoSucursal } from './Producto'

export function useProductosSucursal(sucursalId: number | null) {
  const [productosSucursal, setProductosSucursal] = useState<ProductoSucursal[]>([])
  const [loadingSucursal, setLoadingSucursal] = useState(false)

  useEffect(() => {
    if (!sucursalId) return

    const fetch = async () => {
      setLoadingSucursal(true)
      try {
        const res = await axios.get<ProductoSucursal[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Producto/${sucursalId}`
        )
        setProductosSucursal(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingSucursal(false)
      }
    }
    fetch()
  }, [sucursalId])

  return { productosSucursal, loadingSucursal, setProductosSucursal }
}