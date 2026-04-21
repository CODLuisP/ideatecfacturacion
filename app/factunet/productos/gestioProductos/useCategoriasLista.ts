import { useState, useEffect } from 'react'
import axios from 'axios'
import { Categoria } from './Producto'
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/app/components/ui/Toast';

export function useCategoriasLista() {
  const { showToast } = useToast();
  const { accessToken } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  const fetchCategorias = async () => {
    setLoadingCategorias(true)
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Categorias`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      const data: Categoria[] = res.data.map((c: any) => ({
        categoriaId: c.categoriaId,
        categoriaNombre: c.categoriaNombre,
      }))
      setCategorias(data)
    } catch {
      showToast("Error al cargar categorías", "error");
    } finally {
      setLoadingCategorias(false)
    }
  }

  useEffect(() => {
    if (accessToken) fetchCategorias()
  }, [accessToken])

  return { categorias, loadingCategorias }
}