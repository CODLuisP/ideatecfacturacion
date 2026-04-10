export interface Direccion {
  direccionId: number
  direccionLineal: string
  ubigeo: string
  departamento: string
  provincia: string
  distrito: string
  tipoDireccion: string
}

export interface TipoDocumento {
  tipoDocumentoId: string
  tipoDocumentoNombre: string
}

export interface Cliente {
  clienteId: number
  sucursalID: number
  razonSocialNombre: string
  numeroDocumento: string
  nombreComercial: string | null
  fechaCreacion: string
  telefono: string | null
  correo: string | null
  estado: boolean
  tipoDocumento: TipoDocumento
  direccion: Direccion[]
}