/**
 * Genera un código de producto automático basado en el nombre y el correlativo.
 *
 * Ejemplos:
 *  - "CELULAR"           → CEL-000001
 *  - "GASEOSA COCA COLA" → GCC-000002
 *  - "AZUCAR BLANCA"     → AZB-000003
 */
// gestioProductos/generarCodigoProducto.ts

export function generarCodigoProducto(nombre: string, totalEmpresa: number): string {
  const palabras = nombre.trim().toUpperCase().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return ""

  let prefijo = ""

  if (palabras.length === 1) {
    prefijo = palabras[0].slice(0, 3)
  } else if (palabras.length === 2) {
    prefijo = palabras[0].slice(0, 2) + palabras[1].slice(0, 1)
  } else {
    prefijo = palabras.slice(0, 3).map((p) => p[0]).join("")
  }

  const correlativo = String(totalEmpresa + 1).padStart(6, "0")
  return `${prefijo}-${correlativo}`
}