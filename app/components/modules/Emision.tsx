"use client";
import React, { useState } from 'react';
import { 
  FileText, 
  AlertCircle, 
  Plus, 
  Search, 
  Printer, 
  ShieldCheck 
} from 'lucide-react';

import { ChevronLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const EmisionView = () => {
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [docType, setDocType] = useState('');

  const handleSelect = (type: string) => {
    setDocType(type);
    setStep('form');
  };

  if (step === 'selection') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">¿Qué comprobante deseas emitir?</h2>
          <p className="text-gray-500">Selecciona el tipo de documento para comenzar el proceso de emisión.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Factura Electrónica', desc: 'Para empresas y negocios con RUC (con derecho a crédito fiscal).', icon: FileText, type: 'Factura' },
            { title: 'Boleta de Venta', desc: 'Para personas naturales y consumidores finales sin RUC.', icon: FileText, type: 'Boleta' },
            { title: 'Nota de Crédito', desc: 'Para anular o modificar comprobantes emitidos previamente.', icon: AlertCircle, type: 'NC' },
            { title: 'Nota de Débito', desc: 'Para aumentar el valor de un comprobante emitido previamente.', icon: Plus, type: 'ND' },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => handleSelect(item.type)}
              className="group p-8 bg-white rounded-2xl border-2 border-transparent hover:border-brand-blue shadow-sm hover:shadow-md transition-all text-left flex gap-6 items-start"
            >
              <div className="p-4 rounded-xl bg-blue-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
                <item.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" onClick={() => setStep('selection')} className="h-10 w-10 p-0 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Nueva {docType}</h3>
          <p className="text-sm text-gray-500">Regresar a selección de comprobante</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Datos del Comprobante" subtitle="Completa la información requerida">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Cliente (RUC/DNI)</label>
                <div className="relative">
                  <input type="text" placeholder="Buscar cliente..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Serie y Número</label>
                <div className="flex gap-2">
                  <select className="w-1/3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                    <option>F001</option>
                    <option>F002</option>
                  </select>
                  <input type="text" disabled value="0000126" className="w-2/3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl px-4 text-gray-500 font-mono" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase">Ítems / Productos</label>
                <Button variant="ghost" className="h-8 text-xs text-brand-blue"><Plus className="w-3 h-3" /> Agregar ítem</Button>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">Cant.</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">P. Unit</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td className="px-4 py-3">Servicio de Consultoría IT - Mayo</td>
                      <td className="px-4 py-3 text-center">1</td>
                      <td className="px-4 py-3 text-right">1,000.00</td>
                      <td className="px-4 py-3 text-right font-semibold">1,000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setStep('selection')}>Cancelar</Button>
              <div className="space-y-2 text-right">
                <div className="flex justify-end gap-8 text-sm text-gray-500">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900">S/ 847.46</span>
                </div>
                <div className="flex justify-end gap-8 text-sm text-gray-500">
                  <span>IGV (18%):</span>
                  <span className="font-medium text-gray-900">S/ 152.54</span>
                </div>
                <div className="flex justify-end gap-8 text-lg font-bold text-brand-blue">
                  <span>Total:</span>
                  <span>S/ 1,000.00</span>
                </div>
              </div>
            </div>
          </form>
        </Card>
      </div>

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
            <Button className="w-full py-3 text-base">Emitir Comprobante</Button>
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
};
