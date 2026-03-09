"use client";
import React from 'react';
import { Search, Upload, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Modal } from '@/app/components/ui/Modal';
import { cn } from '@/app/utils/cn';

interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: string;
  code: string;
}

interface FormState {
  name: string;
  category: string;
  code: string;
  stock: string;
  price: string;
}

interface FormFieldsProps {
  form: FormState;
  onChange: (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const initialProducts: Product[] = [
  { id: 1, name: 'Laptop Pro 14"', category: 'Electrónica', stock: 12, price: '4500.00', code: 'PROD-001' },
  { id: 2, name: 'Monitor 27" 4K', category: 'Electrónica', stock: 5, price: '1200.00', code: 'PROD-002' },
  { id: 3, name: 'Silla Ergonómica', category: 'Muebles', stock: 0, price: '850.00', code: 'PROD-003' },
  { id: 4, name: 'Teclado Mecánico', category: 'Accesorios', stock: 25, price: '350.00', code: 'PROD-004' },
];

const emptyForm: FormState = { name: '', category: 'Electrónica', code: '', stock: '', price: '' };

function FormFields({ form, onChange }: FormFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Producto</label>
        <input
          required
          type="text"
          value={form.name}
          onChange={onChange('name')}
          placeholder='Ej: Monitor LED 24"'
          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
          <select
            value={form.category}
            onChange={onChange('category')}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          >
            <option>Electrónica</option>
            <option>Muebles</option>
            <option>Accesorios</option>
            <option>Otros</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Código / SKU</label>
          <input
            type="text"
            value={form.code}
            onChange={onChange('code')}
            placeholder="PROD-005"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
          <input
            type="number"
            value={form.stock}
            onChange={onChange('stock')}
            placeholder="0"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Precio Unitario</label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={onChange('price')}
            placeholder="0.00"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          />
        </div>
      </div>
    </>
  );
}

export default function ProductosPage() {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [search, setSearch] = React.useState<string>('');
  const [nextId, setNextId] = React.useState<number>(5);

  const [isNewOpen, setIsNewOpen] = React.useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = React.useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = React.useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false);

  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [editTarget, setEditTarget] = React.useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [importFile, setImportFile] = React.useState<File | null>(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleFormChange = React.useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
      },
    []
  );

  const handleSaveNew = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProducts((prev) => [...prev, {
      id: nextId,
      name: form.name,
      category: form.category,
      code: form.code || `PROD-00${nextId}`,
      stock: parseInt(form.stock) || 0,
      price: parseFloat(form.price || '0').toFixed(2),
    }]);
    setNextId((n) => n + 1);
    setForm(emptyForm);
    setIsNewOpen(false);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditTarget(prod);
    setForm({ name: prod.name, category: prod.category, code: prod.code, stock: String(prod.stock), price: prod.price });
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    setProducts((prev) =>
      prev.map((p) => p.id === editTarget.id
        ? { ...p, name: form.name, category: form.category, code: form.code, stock: parseInt(form.stock) || 0, price: parseFloat(form.price).toFixed(2) }
        : p
      )
    );
    setIsEditOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
  };

  const handleOpenDelete = (prod: Product) => {
    setDeleteTarget(prod);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleImport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsImportOpen(false);
    setImportFile(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos por código o nombre..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4" /> Importar
          </Button>
          <Button onClick={() => { setForm(emptyForm); setIsNewOpen(true); }}>
            <Plus className="w-4 h-4" /> Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 && (
          <p className="text-gray-400 col-span-3 text-center py-12">No se encontraron productos.</p>
        )}
        {filtered.map((prod) => (
          <Card key={prod.id} className="group hover:border-brand-blue transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{prod.code}</p>
                <h4 className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{prod.name}</h4>
                <p className="text-xs text-gray-500">{prod.category}</p>
              </div>

              {/* Iconos directos sin dropdown */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="p-1.5 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenDelete(prod)}
                  className="p-1.5 text-gray-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
                <p className="text-xl font-black text-brand-blue">S/ {prod.price}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal: Nuevo Producto */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Registrar Nuevo Producto">
        <form className="space-y-4" onSubmit={handleSaveNew}>
          <FormFields form={form} onChange={handleFormChange} />
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="danger" type="button" onClick={() => setIsNewOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Producto</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Producto">
        <form className="space-y-4" onSubmit={handleSaveEdit}>
          <FormFields form={form} onChange={handleFormChange} />
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Importar */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Importar Productos">
        <form className="space-y-5" onSubmit={handleImport}>
          <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-blue transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600 mb-1">Arrastra tu archivo aquí o haz click</p>
            <p className="text-xs text-gray-400 mb-3">Formatos: .csv, .xlsx</p>
            {importFile ? (
              <span className="text-xs text-brand-blue font-semibold">✓ {importFile.name}</span>
            ) : (
              <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg">Seleccionar archivo</span>
            )}
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImportFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-700 mb-1 uppercase">Columnas esperadas</p>
            <p className="text-xs text-blue-600 font-mono">nombre, categoría, código, stock, precio</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={!importFile}>Importar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar Eliminar */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Eliminar Producto">
        <div className="space-y-5">
          <div className="flex gap-4 p-4 bg-rose-50 rounded-xl">
            <Trash2 className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-800">{deleteTarget?.name}</p>
              <p className="text-sm text-gray-500 mt-1">Esta acción no se puede deshacer. ¿Confirmas que deseas eliminar este producto?</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} className="!bg-rose-500 hover:!bg-rose-600 !border-rose-500">
              Sí, eliminar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}