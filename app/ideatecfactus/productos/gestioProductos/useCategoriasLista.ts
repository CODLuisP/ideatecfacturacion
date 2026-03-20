import { useState, useEffect } from 'react'
import axios from 'axios'
import { Categoria } from './Producto'

export function useCategoriasLista() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoadingCategorias(true)
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/Categorias`)
        // 🔥 solo mapeamos los dos campos que necesitamos
        const data: Categoria[] = res.data.map((c: any) => ({
          categoriaId: c.categoriaId,
          categoriaNombre: c.categoriaNombre,
        }))
        setCategorias(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCategorias(false)
      }
    }
    fetch()
  }, [])

  return { categorias, loadingCategorias }
}