import { useState, useEffect } from 'react'
import axios from 'axios'
import { Cliente } from '@/app/ideatecfactus/clientes/gestionClientes/Cliente'

export function useClientesLista() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingLista, setLoadingLista] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoadingLista(true)
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/cliente`)
        setClientes(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingLista(false)
      }
    }
    fetch()
  }, [])

  return { clientes, loadingLista }
}