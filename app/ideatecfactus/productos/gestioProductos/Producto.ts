export interface Categoria {
  categoriaId: number
  categoriaNombre: string
  descripcion: string | null
  estado: boolean
}

export interface Producto {
  productoId: number
  codigo: string
  tipoProducto: string
  codigoSunat: string | null
  descripcion: string
  unidadMedida: string
  precioUnitario: number
  tipoAfectacionIGV: string
  incluirIGV: boolean
  stock: number
  estado: boolean
  fechaCreacion: string
  categoria: Categoria
}

export interface NuevoProducto {
  codigo: string
  tipoProducto: string
  codigoSunat: string
  descripcion: string
  unidadMedida: string
  precioUnitario: number
  tipoAfectacionIGV: string
  incluirIGV: boolean
  stock: number
  categoriaId: number
}

export interface EditProducto {
  productoId: number
  codigo: string
  tipoProducto: string
  codigoSunat: string
  descripcion: string
  unidadMedida: string
  precioUnitario: number
  tipoAfectacionIGV: string
  incluirIGV: boolean
  stock: number
  categoriaId: number
}
