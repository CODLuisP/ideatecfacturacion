// ─── Types ────────────────────────────────────────────────────────────────────
export interface Sucursal {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  usuario: string;
  serieFactura: string;
  correlativoFactura: number;
  serieBoleta: string;
  correlativoBoleta: number;
  serieNotaCredito: string;
  correlativoNotaCredito: number;
  serieNotaDebito: string;
  correlativoNotaDebito: number;
  serieGuia: string;
  correlativoGuia: number;
}

export interface NuevaSucursalForm {
  nombre: string;
  direccion: string;
  usuario: string;
  password: string;
  confirmPassword: string;
  serieFactura: string;
  correlativoFactura: number;
  serieBoleta: string;
  correlativoBoleta: number;
  serieNotaCredito: string;
  correlativoNotaCredito: number;
  serieNotaDebito: string;
  correlativoNotaDebito: number;
  serieGuia: string;
  correlativoGuia: number;
}

export interface EditSucursalForm {
  nombre: string;
  direccion: string;
}