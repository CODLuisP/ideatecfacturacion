"use client";
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Users, Package,
  BarChart3, Zap, Settings, UserCircle, Download, Plus, FileBox,
  Building2,
  Grip
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { ToastProvider } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { MenuItem, View } from '../types';
import { RECENT_DOCS } from '../components/data/mockData';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeView = (pathname.split('/').pop() as View) || 'dashboard';

  React.useEffect(() => {
    if (pathname === '/factunet' || pathname === '/factunet/') {
      router.push('/factunet/dashboard');
    }
  }, [pathname]);

  const handleExport = () => {
    const headers = "Fecha,ID Comprobante,Cliente,Total,Estado\n";
    const rows = RECENT_DOCS.map(doc => `${doc.date},${doc.id},"${doc.client}",${doc.total},${doc.status}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'emision', label: 'Emisión', icon: FileText },
    { id: 'operaciones', label: 'Operaciones', icon: Grip },
    { id: 'ver-comprobantes', label: 'Comprobantes', icon: FileBox },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'sunat', label: 'SUNAT', icon: Zap },
    { id: 'empresa', label: 'Empresa', icon: Settings },
    { id: 'sucursales', label: 'Sucursales', icon: Building2 }, 
    { id: 'usuarios', label: 'Usuarios', icon: UserCircle },
  ];

  return (
    <ToastProvider>
      <div className="h-screen flex bg-brand-light overflow-x-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          activeView={activeView}
          onViewChange={(view) => router.push(`/factunet/${view}`)}
          menuItems={menuItems}
        />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Topbar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            activeView={activeView}
          />
          <main className="flex-1 px-6 py-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className=" mx-auto">
              <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                {activeView === 'dashboard' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4" /> Exportar Reporte</Button>
                    <Button onClick={() => router.push('/factunet/operaciones')}><Plus className="w-4 h-4" /> Nuevo Comprobante</Button>
                  </div>
                )}
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}