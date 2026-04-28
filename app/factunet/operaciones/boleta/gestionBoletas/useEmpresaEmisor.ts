import { useState, useEffect } from 'react'
import axios from 'axios'
import { BoletaCompany } from './Boleta'
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/app/components/ui/Toast';

export function useEmpresaEmisor() {
  const { showToast } = useToast();
  const { accessToken, user } = useAuth();
  const [empresa, setEmpresa] = useState<BoletaCompany | null>(null)
  const [loadingEmpresa, setLoadingEmpresa] = useState(false)

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

  const fetchEmpresa = async () => {
    if (!user?.ruc) return
    setLoadingEmpresa(true)

    for (let i = 0; i < 3; i++) {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/companies/${user.ruc}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        const data = res.data
        setEmpresa({
          empresaId: data.id,
          numeroDocumento: data.ruc,
          razonSocial: data.razonSocial,
          nombreComercial: data.nombreComercial,
          direccionLineal: data.direccion,
          ubigeo: data.ubigeo,
          provincia: data.provincia,
          departamento: data.departamento,
          distrito: data.distrito,
          establecimientoAnexo: "0000"
        })
        setLoadingEmpresa(false)
        return
      } catch {
        if (i < 2) {
          await sleep(1000 * (i + 1))
        } else {
          showToast("Error al obtener los datos de la empresa", "error")
          setLoadingEmpresa(false)
        }
      }
    }
  }

  useEffect(() => {
    if (accessToken) fetchEmpresa()
  }, [accessToken])

  return { empresa, loadingEmpresa }
}