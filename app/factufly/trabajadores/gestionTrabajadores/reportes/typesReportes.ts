export interface ServicioTrabajadorDTO {
  comprobanteId: number;
  numeroCompleto: string;
  tipoComprobante: string;
  fechaEmision: string;
  tipoMoneda: string;
  estadoSunat: string;
  clienteNumDoc: string;
  clienteRazonSocial: string;
  detalleId: number;
  codigo: string | null;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  totalVentaItem: number;
}

export interface ReporteTrabajadorDTO {
  trabajadorId: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  dni: string;
  totalComprobantes: number;
  totalServicios: number;
  totalMonto: number;
  servicios: ServicioTrabajadorDTO[];
}

export interface RankingTrabajadorDTO {
  trabajadorId: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  dni: string;
  totalComprobantes: number;
  totalServicios: number;
  totalMonto: number;
}

export interface ServicioTopDTO {
  descripcion: string;
  codigo: string | null;
  totalVeces: number;
  totalCantidad: number;
  totalMonto: number;
  precioPromedio: number;
}

export interface ReporteClienteDTO {
  clienteNumDoc: string;
  clienteRazonSocial: string;
  totalServicios: number;
  totalComprobantes: number;
  totalMonto: number;
  trabajadores: ReporteTrabajadorDTO[];
}