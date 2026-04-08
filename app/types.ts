import { LucideIcon } from 'lucide-react';

export type View = 'dashboard' | 'emisionRapida' |'emision' | 'clientes' | 'productos' | 'reportes' | 'sunat' | 'empresa' | 'sucursales' | 'usuarios' | 'ver-comprobantes';

export interface MenuItem {
  id: View;
  label: string;
  icon: LucideIcon;
}

export interface SalesData {
  name: string;
  sales: number;
  docs: number;
}

export interface Document {
  id: string;
  client: string;
  total: string;
  status: string;
  date: string;
}
