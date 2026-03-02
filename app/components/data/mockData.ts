import { SalesData,Document } from "@/app/types";


export const SALES_DATA: SalesData[] = [
  { name: 'Lun', sales: 4000, docs: 24 },
  { name: 'Mar', sales: 3000, docs: 18 },
  { name: 'Mie', sales: 2000, docs: 12 },
  { name: 'Jue', sales: 2780, docs: 20 },
  { name: 'Vie', sales: 1890, docs: 15 },
  { name: 'Sab', sales: 2390, docs: 10 },
  { name: 'Dom', sales: 3490, docs: 22 },
];

export const RECENT_DOCS: Document[] = [
  { id: 'F001-0000123', client: 'Corporación Aceros SAC', total: 'S/ 1,250.00', status: 'Aceptado', date: '2024-05-20' },
  { id: 'B001-0000456', client: 'Juan Pérez García', total: 'S/ 85.50', status: 'Aceptado', date: '2024-05-20' },
  { id: 'F001-0000124', client: 'Inversiones Globales EIRL', total: 'S/ 3,400.00', status: 'Pendiente', date: '2024-05-19' },
  { id: 'NC01-0000012', client: 'Tech Solutions Peru', total: 'S/ -200.00', status: 'Aceptado', date: '2024-05-19' },
  { id: 'F001-0000125', client: 'Minera del Sur S.A.', total: 'S/ 12,800.00', status: 'Rechazado', date: '2024-05-18' },
];
