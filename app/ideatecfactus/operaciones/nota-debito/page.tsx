"use client";
import { useRouter } from 'next/navigation';
import { Search, Printer, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';

export default function NotaDebitoPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" onClick={() => router.push('/ideatecfactus/operaciones')} className="h-10 w-10 p-0 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Nueva Nota de Débito</h3>
          <p className="text-sm text-gray-500">Regresar a selección de comprobante</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Datos de la Nota de Débito" subtitle="Completa la información requerida">
            <form className="space-y-6">
              {/* Comprobante de referencia */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Comprobante de Referencia</label>
                <div className="relative">
                  <input type="text" placeholder="Buscar factura o boleta a modificar..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Serie, número y motivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Serie y Número</label>
                  <div className="flex gap-2">
                    <select className="w-1/3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                      <option>FD01</option>
                      <option>BD01</option>
                    </select>
                    <input type="text" disabled value="0000008" className="w-2/3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl px-4 text-gray-500 font-mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Motivo</label>
                  <select className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                    <option>01 - Intereses por mora</option>
                    <option>02 - Aumento en el valor</option>
                    <option>03 - Penalidades / otros conceptos</option>
                  </select>
                </div>
              </div>

              {/* Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Fecha de Emisión</label>
                  <input type="date" className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                </div>
              </div>

              {/* Monto adicional */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Monto Adicional</label>
                <input type="number" placeholder="0.00" className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción / Sustento</label>
                <textarea rows={3} placeholder="Describe el motivo de la nota de débito..." className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all resize-none" />
              </div>

              <div className="flex justify-end items-end pt-4 border-t border-gray-100">
                <div className="space-y-2 text-right">
                  <div className="flex justify-end gap-8 text-lg font-bold text-brand-blue">
                    <span>Monto adicional:</span>
                    <span>S/ 0.00</span>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Vista Previa" subtitle="Representación gráfica del comprobante">
            <div className="aspect-[1/1.4] bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="p-4 rounded-full bg-white shadow-sm">
                <Printer className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Previsualización del PDF</p>
                <p className="text-xs text-gray-400 mt-1">Se generará automáticamente al emitir</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button className="w-full py-3 text-base">Emitir Nota de Débito</Button>
              <Button variant="outline" className="w-full">Guardar como Borrador</Button>
            </div>
          </Card>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Este comprobante será enviado automáticamente a la <strong>SUNAT</strong> y validado en tiempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}