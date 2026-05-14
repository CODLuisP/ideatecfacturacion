export interface Trabajador {
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  dni: string;
  celular: string | null;
  email: string | null;
  estado: boolean;
  sucursalId: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrarTrabajadorDTO {
  nombres: string;
  apellidos: string;
  dni: string;
  celular?: string;
  email?: string;
  sucursalId: number;
}

export interface EditarTrabajadorDTO {
  nombres: string;
  apellidos: string;
  dni: string;
  celular?: string | null;
  email?: string | null;
  sucursalId?: number | null;
}