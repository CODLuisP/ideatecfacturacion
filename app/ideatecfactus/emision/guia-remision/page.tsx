"use client";
import { useRouter } from 'next/navigation';
import { Search, Plus, Printer, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';

export default function GuiaRemisionPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" onClick={() => router.push('/emision')} className="h-10 w-10 p-0 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Nueva Guía de Remisión</h3>
          <p className="text-sm text-gray-500">Regresar a selección de comprobante</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Datos del Traslado" subtitle="Completa la información requerida">
            <form className="space-y-6">
              {/* Serie y número */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Serie y Número</label>
                  <div className="flex gap-2">
                    <select className="w-1/3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                      <option>T001</option>
                      <option>T002</option>
                    </select>
                    <input type="text" disabled value="0000034" className="w-2/3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl px-4 text-gray-500 font-mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Fecha de Traslado</label>
                  <input type="date" className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                </div>
              </div>

              {/* Motivo de traslado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Motivo de Traslado</label>
                  <select className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                    <option>01 - Venta</option>
                    <option>02 - Compra</option>
                    <option>03 - Traslado entre establecimientos</option>
                    <option>04 - Consignación</option>
                    <option>08 - Importación</option>
                    <option>09 - Exportación</option>
                    <option>13 - Otros</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Modalidad de Traslado</label>
                  <select className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                    <option>01 - Transporte público</option>
                    <option>02 - Transporte privado</option>
                  </select>
                </div>
              </div>

              {/* Direcciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Punto de Partida</label>
                  <input type="text" placeholder="Dirección de origen..." className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Punto de Llegada</label>
                  <input type="text" placeholder="Dirección de destino..." className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                </div>
              </div>

              {/* Transportista */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Transportista (RUC)</label>
                  <div className="relative">
                    <input type="text" placeholder="Buscar transportista..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">N° de Placa</label>
                  <input type="text" placeholder="Ej. ABC-123" className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                </div>
              </div>

              {/* Destinatario */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Destinatario (RUC/DNI)</label>
                <div className="relative">
                  <input type="text" placeholder="Buscar destinatario..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Bienes a trasladar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase">Bienes a Trasladar</label>
                  <Button variant="ghost" className="h-8 text-xs text-brand-blue"><Plus className="w-3 h-3 mr-1" /> Agregar bien</Button>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-500">Cant.</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-500">Unidad</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500">Peso (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      <tr>
                        <td className="px-4 py-3">Caja de materiales de oficina</td>
                        <td className="px-4 py-3 text-center">10</td>
                        <td className="px-4 py-3 text-center">NIU</td>
                        <td className="px-4 py-3 text-right">25.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => router.push('/emision')}>Cancelar</Button>
                <div className="space-y-2 text-right">
                  <div className="flex justify-end gap-8 text-sm text-gray-500">
                    <span>Total bultos:</span>
                    <span className="font-medium text-gray-900">10</span>
                  </div>
                  <div className="flex justify-end gap-8 text-lg font-bold text-brand-blue">
                    <span>Peso bruto total:</span>
                    <span>25.00 kg</span>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Vista Previa" subtitle="Representación gráfica de la guía">
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
              <Button className="w-full py-3 text-base">Emitir Guía de Remisión</Button>
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