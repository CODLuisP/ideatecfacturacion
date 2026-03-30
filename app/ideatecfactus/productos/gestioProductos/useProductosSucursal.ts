import { useState, useEffect } from 'react'
import axios from 'axios'
import { ProductoSucursal } from './Producto'
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/app/components/ui/Toast';

export function useProductosSucursal() {
  const { showToast } = useToast();
  const { accessToken, user } = useAuth();
  const [productosSucursal, setProductosSucursal] = useState<ProductoSucursal[]>([])
  const [loadingSucursal, setLoadingSucursal] = useState(false)

  const fetchProductosSucursal = async () => {
    setLoadingSucursal(true)
    try {
      const res = await axios.get<ProductoSucursal[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/productos/${user?.sucursalID}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      setProductosSucursal(res.data)
    } catch (err) {
      showToast("Error al cargar productos", "error");
    } finally {
      setLoadingSucursal(false)
    }
  }

  useEffect(() => {
    if (accessToken) fetchProductosSucursal()
  }, [accessToken])

  return { productosSucursal, loadingSucursal, setProductosSucursal }
}

