import { useState, useEffect } from 'react'
import axios from 'axios'
import { ProductoBase } from './Producto'
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/app/components/ui/Toast';

export function useProductosBaseDisponiblesLista() {
  const { showToast } = useToast();
  const { accessToken, user } = useAuth();
  const [productosBase, setProductosBase] = useState<ProductoBase[]>([])
  const [loadingBase, setLoadingBase] = useState(false)

  const fetchProductosBase = async () => {
    setLoadingBase(true)
    try {
      const res = await axios.get<ProductoBase[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/productos/disponibles/${user?.sucursalID}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      setProductosBase(res.data)
    } catch {
      showToast("Error al cargar productos disponibles", "error");
    } finally {
      setLoadingBase(false)
    }
  }

  useEffect(() => {
    if (accessToken) fetchProductosBase()
  }, [accessToken])

  return { productosBase, loadingBase }
}