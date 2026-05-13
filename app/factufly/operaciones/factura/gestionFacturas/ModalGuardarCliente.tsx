'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { InputBase } from '@/app/components/ui/InputBase'

interface Props {
  cliente: {
    numeroDocumento: string
    razonSocial: string
    tipoDocumento: string
    ubigeo: string
    direccionLineal: string
    departamento: string
    provincia: string
    distrito: string
  }
  onGuardar: (extra: { nombreComercial: string; telefono: string; correo: string }) => Promise<void>
  onCerrar: () => void
}

export function ModalGuardarCliente({ cliente, onGuardar, onCerrar }: Props) {
  const [nombreComercial, setNombreComercial] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const telefonoValido = telefono.trim() !== ''
  const correoValido = correo.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)

  const handleGuardar = async () => {
    setEnviado(true)
    if (!telefonoValido || !correoValido) return
    setGuardando(true)
    try {
      await onGuardar({ nombreComercial, telefono, correo })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Guardar Cliente</h3>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info cliente */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
          <p className="text-sm font-semibold text-gray-800">{cliente.razonSocial}</p>
          <p className="text-xs text-gray-500">RUC: {cliente.numeroDocumento}</p>
          <p className="text-xs text-gray-400">{cliente.direccionLineal}</p>
          <p className="text-xs text-gray-400">{cliente.distrito}, {cliente.provincia}, {cliente.departamento}</p>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <InputBase
            label="Nombre Comercial"
            labelOptional="(opcional)"
            value={nombreComercial}
            onChange={(e) => setNombreComercial(e.target.value)}
            placeholder="Nombre comercial"
          />
          <InputBase
            label="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 999888777"
            showError={enviado && !telefonoValido}
            errorMessage="El teléfono es obligatorio"
          />
          <InputBase
            label="Correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ejemplo.com"
            showError={enviado && !correoValido}
            errorMessage={correo.trim() === '' ? 'El correo es obligatorio' : 'Ingresa un correo válido'}
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="w-full" type="button" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button className="w-full" type="button" onClick={handleGuardar} disabled={guardando}>
            {guardando ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : 'Guardar Cliente'}
          </Button>
        </div>
      </div>
    </div>
  )
}