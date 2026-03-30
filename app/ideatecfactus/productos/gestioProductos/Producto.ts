// ─── Categoría ───────────────────────────────────────────────
export interface Categoria {
  categoriaId: number;
  categoriaNombre: string;
}

// ─── SucursalProducto (precio y stock por sucursal) ──────────
export interface SucursalProducto {
  sucursalProductoId: number;
  precioUnitario: number;
  stock: number | null;
}

// ─── Producto Base (sin datos de sucursal) ───────────────────
export interface ProductoBase {
  productoId: number;
  codigo: string;
  tipoProducto: string | null;
  codigoSunat: string | null;
  nomProducto: string;
  unidadMedida: string;
  tipoAfectacionIGV: string;
  incluirIGV: boolean;
  estado: boolean;
  fechaCreacion: string;
  categoria: Categoria | null;
}

// ─── Producto con datos de sucursal ──────────────────────────
export interface ProductoSucursal extends ProductoBase {
  sucursalProducto: SucursalProducto;
}

// ─── Para crear nuevo producto (POST) ────────────────────────
export interface NuevoProducto {
  codigo: string;
  tipoProducto: string;
  codigoSunat: string;
  nomProducto: string;
  unidadMedida: string;
  tipoAfectacionIGV: string;
  incluirIGV: boolean;
  categoriaId: number;
  sucursalId: number;
  precioUnitario: number;
  stock: number | null;
}

// ─── Para editar producto (PUT) ───────────────────────────────
export interface EditProducto {
  productoId: number;
  codigo: string;
  tipoProducto: string;
  codigoSunat: string;
  nomProducto: string;
  unidadMedida: string;
  tipoAfectacionIGV: string;
  incluirIGV: boolean;
  categoriaId: number;
  sucursalProductoId: number;
  precioUnitario: number;
  stock: number | null;
}