import { useState, useEffect } from 'react'
import axios from 'axios'
import { ProductoBase } from './Producto'

export function useProductosBaseDisponiblesLista(sucursalId: number | null) {
  const [productosBase, setProductosBase] = useState<ProductoBase[]>([])
  const [loadingBase, setLoadingBase] = useState(false)

  useEffect(() => {
    if (!sucursalId) return

    const fetch = async () => {
      setLoadingBase(true)
      try {
        const res = await axios.get<ProductoBase[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Producto/disponibles/${sucursalId}` // 🔥 sucursalId en la url
        )
        setProductosBase(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingBase(false)
      }
    }
    fetch()
  }, [sucursalId])

  return { productosBase, loadingBase }
}