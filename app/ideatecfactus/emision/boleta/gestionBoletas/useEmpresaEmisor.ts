import { useState, useEffect } from 'react'
import axios from 'axios'
import { BoletaCompany } from './Boleta'

export function useEmpresaEmisor(ruc: string | undefined) {
  const [empresa, setEmpresa] = useState<BoletaCompany | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ruc) return

    const fetchEmpresa = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${ruc}`)
        const data = response.data

        const empresaFiltrada: BoletaCompany = {
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
        }

        setEmpresa(empresaFiltrada)
      } catch (err) {
        setError('Error al obtener los datos de la empresa')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresa()
  }, [ruc])

  return { empresa, loading, error }
}