"use client";
import React from 'react';
import { useToast } from '@/app/components/ui/Toast';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';

export default function ConfiguracionPage() {
  const { showToast } = useToast();

  const handleSave = () => {
    showToast('Configuración guardada correctamente', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Card title="Datos de la Empresa" subtitle="Información que aparecerá en tus comprobantes">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
              <img src="https://picsum.photos/seed/company/200/200" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="h-9 text-xs" onClick={() => showToast('Funcionalidad de carga de logo en desarrollo', 'info')}>Cambiar Logo</Button>
              <p className="text-[10px] text-gray-400">JPG, PNG o SVG. Máximo 2MB.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">RUC</label>
            <input type="text" value="20601234567" disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Razón Social</label>
            <input type="text" defaultValue="MI EMPRESA DIGITAL SAC" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Nombre Comercial</label>
            <input type="text" defaultValue="FacturaPro Perú" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Dirección Fiscal</label>
            <input type="text" defaultValue="Av. Javier Prado Este 1234, San Isidro, Lima" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue" />
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </div>
      </Card>

      <Card title="Configuración de Impuestos" subtitle="Parámetros tributarios SUNAT">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-bold text-gray-900">IGV (Impuesto General a las Ventas)</p>
              <p className="text-xs text-gray-500">Tasa estándar aplicada a la mayoría de productos y servicios.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-brand-blue">18%</span>
              <div className="w-10 h-5 bg-brand-blue rounded-full relative cursor-pointer" onClick={() => showToast('Tasa de IGV bloqueada por normativa SUNAT', 'info')}>
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-bold text-gray-900">Impuesto al Consumo de Bolsas Plásticas (ICBPER)</p>
              <p className="text-xs text-gray-500">Monto fijo por cada bolsa plástica entregada.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-brand-blue">S/ 0.50</span>
              <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer" onClick={() => showToast('Impuesto ICBPER activado', 'success')}>
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}