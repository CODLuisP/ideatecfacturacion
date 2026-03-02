"use client";
import React from 'react';
import { Search, Download, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Modal } from '@/app/components/ui/Modal';
import { cn } from '@/app/utils/cn';

export default function ProductosPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input type="text" placeholder="Buscar productos por código o nombre..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm" />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="w-4 h-4" /> Importar</Button>
          <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> Nuevo Producto</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Laptop Pro 14"', category: 'Electrónica', stock: 12, price: 'S/ 4,500.00', code: 'PROD-001' },
          { name: 'Monitor 27" 4K', category: 'Electrónica', stock: 5, price: 'S/ 1,200.00', code: 'PROD-002' },
          { name: 'Silla Ergonómica', category: 'Muebles', stock: 0, price: 'S/ 850.00', code: 'PROD-003' },
          { name: 'Teclado Mecánico', category: 'Accesorios', stock: 25, price: 'S/ 350.00', code: 'PROD-004' },
        ].map((prod, i) => (
          <Card key={i} className="group hover:border-brand-blue transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{prod.code}</p>
                <h4 className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{prod.name}</h4>
                <p className="text-xs text-gray-500">{prod.category}</p>
              </div>
              <button className="p-1 text-gray-300 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Stock</p>
                <p className={cn("text-lg font-bold", prod.stock === 0 ? 'text-rose-500' : 'text-gray-900')}>
                  {prod.stock} <span className="text-xs font-normal text-gray-400">unid.</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold">Precio (Inc. IGV)</p>
                <p className="text-xl font-black text-brand-blue">{prod.price}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Producto">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Producto</label>
            <input type="text" placeholder='Ej: Monitor LED 24"' className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
              <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                <option>Electrónica</option>
                <option>Muebles</option>
                <option>Accesorios</option>
                <option>Otros</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Código / SKU</label>
              <input type="text" placeholder="Ej: PROD-005" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Stock Inicial</label>
              <input type="number" placeholder="0" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Precio Unitario</label>
              <input type="text" placeholder="0.00" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Producto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}