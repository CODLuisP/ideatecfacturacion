"use client";
import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Eye, Send, Edit2, Trash2, X,
  ChevronDown, CheckCircle2, XCircle, Building2, User, Mail, MapPin, Hash
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { cn } from '@/app/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Cliente {
  id: number;
  doc: string;
  tipoDoc: 'RUC' | 'DNI' | 'CE';
  name: string;
  email: string;
  direccion: string;
  last: string;
  status: 'Activo' | 'Inactivo';
}

// ─── Data inicial ──────────────────────────────────────────────────────────────

const INITIAL_CLIENTES: Cliente[] = [
  { id: 1, doc: '20601234567', tipoDoc: 'RUC', name: 'Corporación Aceros SAC',    email: 'ventas@aceros.pe',         direccion: 'Av. Industrial 234, Lima',        last: '20/05/2025', status: 'Activo'   },
  { id: 2, doc: '10456789012', tipoDoc: 'DNI', name: 'Juan Pérez García',          email: 'juan.perez@gmail.com',     direccion: 'Jr. Las Flores 456, Miraflores', last: '18/05/2025', status: 'Activo'   },
  { id: 3, doc: '20558899776', tipoDoc: 'RUC', name: 'Tech Solutions Peru SAC',    email: 'admin@techsolutions.com',  direccion: 'Calle Los Pinos 789, San Isidro', last: '15/05/2025', status: 'Inactivo' },
  { id: 4, doc: '20100200300', tipoDoc: 'RUC', name: 'Inversiones Globales EIRL',  email: 'contacto@globales.pe',     direccion: 'Av. La Marina 1200, San Miguel',  last: '10/05/2025', status: 'Activo'   },
  { id: 5, doc: '10987654321', tipoDoc: 'DNI', name: 'María Torres Quispe',        email: 'maria.torres@hotmail.com', direccion: 'Calle Real 88, Chorrillos',       last: '05/05/2025', status: 'Activo'   },
  { id: 6, doc: '20345678901', tipoDoc: 'RUC', name: 'Distribuidora Central SAC',  email: 'dist.central@gmail.com',   direccion: 'Av. Túpac Amaru 500, Comas',      last: '01/05/2025', status: 'Inactivo' },
  { id: 7, doc: '20233445566', tipoDoc: 'RUC', name: 'Servicios Integrales SAC',   email: 'luis@serviciosintegrales.com', direccion: 'Av. Los Olivos 123, Lince', last: '25/04/2025', status: 'Activo'   },
];




// ─── Modal: Enviar Correo ──────────────────────────────────────────────────────

const EnviarCorreoModal: React.FC<{ cliente: Cliente; onClose: () => void }> = ({ cliente, onClose }) => {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setSent(true);
  };

  return (
    <Modal isOpen onClose={onClose} title={`Enviar correo a ${cliente.name}`}>
      {sent ? (
        <div className="text-center py-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <p className="font-bold text-slate-900 mb-1">¡Correo enviado!</p>
          <p className="text-sm text-slate-500 mb-5">Mensaje enviado a <span className="font-semibold">{cliente.email}</span></p>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
            <Mail size={14} className="text-slate-400" />
            <span className="text-slate-500">Para:</span>
            <span className="font-semibold text-slate-800">{cliente.email}</span>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Asunto</label>
            <input
              type="text" value={asunto} onChange={e => setAsunto(e.target.value)}
              placeholder="Ej: Comprobante de pago - Mayo 2025"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Mensaje</label>
            <textarea
              value={mensaje} onChange={e => setMensaje(e.target.value)}
              rows={4} placeholder="Escribe tu mensaje aquí..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</> : <><Send size={14} /> Enviar</>}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

// ─── Modal: Editar Cliente ─────────────────────────────────────────────────────

const EditarClienteModal: React.FC<{ cliente: Cliente; onClose: () => void; onSave: (c: Cliente) => void }> = ({ cliente, onClose, onSave }) => {
  const [form, setForm] = useState({ ...cliente });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Editar Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Tipo Documento</label>
            <select
              value={form.tipoDoc}
              onChange={e => setForm(f => ({ ...f, tipoDoc: e.target.value as Cliente['tipoDoc'] }))}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
            >
              <option>RUC</option><option>DNI</option><option>CE</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
            <input
              type="text" value={form.doc} onChange={e => setForm(f => ({ ...f, doc: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Razón Social / Nombre</label>
          <input
            type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
          <input
            type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Dirección</label>
          <input
            type="text" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as Cliente['status'] }))}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          >
            <option>Activo</option><option>Inactivo</option>
          </select>
        </div>
        <div className="pt-4 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Modal: Confirmar Eliminación ─────────────────────────────────────────────

const EliminarModal: React.FC<{ cliente: Cliente; onClose: () => void; onConfirm: () => void }> = ({ cliente, onClose, onConfirm }) => (
  <Modal isOpen onClose={onClose} title="Eliminar Cliente">
    <div className="space-y-4">
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
        <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-rose-800">¿Estás seguro?</p>
          <p className="text-xs text-rose-600 mt-0.5">
            Eliminarás permanentemente a <strong>{cliente.name}</strong> ({cliente.doc}). Esta acción no se puede deshacer.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
        >
          <Trash2 size={14} /> Eliminar
        </button>
      </div>
    </div>
  </Modal>
);

// ─── Page Principal ────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(INITIAL_CLIENTES);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos');
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'RUC' | 'DNI' | 'CE'>('Todos');

  const [isNuevoOpen, setIsNuevoOpen] = useState(false);
  const [detalleCliente, setDetalleCliente] = useState<Cliente | null>(null);
  const [correoCliente, setCorreoCliente] = useState<Cliente | null>(null);
  const [editarCliente, setEditarCliente] = useState<Cliente | null>(null);
  const [eliminarCliente, setEliminarCliente] = useState<Cliente | null>(null);

  // ── Nuevo cliente form ──
  const [nuevoForm, setNuevoForm] = useState({ tipoDoc: 'RUC', doc: '', name: '', email: '', direccion: '' });

  const handleNuevoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo: Cliente = {
      id: Date.now(),
      tipoDoc: nuevoForm.tipoDoc as Cliente['tipoDoc'],
      doc: nuevoForm.doc,
      name: nuevoForm.name,
      email: nuevoForm.email,
      direccion: nuevoForm.direccion,
      last: new Date().toLocaleDateString('es-PE'),
      status: 'Activo',
    };
    setClientes(prev => [nuevo, ...prev]);
    setNuevoForm({ tipoDoc: 'RUC', doc: '', name: '', email: '', direccion: '' });
    setIsNuevoOpen(false);
  };

  // ── Filtros ──
  const filtered = useMemo(() => clientes.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.doc.includes(search) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'Todos' || c.status === filterStatus;
    const matchTipo = filterTipo === 'Todos' || c.tipoDoc === filterTipo;
    return matchSearch && matchStatus && matchTipo;
  }), [clientes, search, filterStatus, filterTipo]);

  const activeFilters = (filterStatus !== 'Todos' ? 1 : 0) + (filterTipo !== 'Todos' ? 1 : 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      {correoCliente && <EnviarCorreoModal cliente={correoCliente} onClose={() => setCorreoCliente(null)} />}
      {editarCliente && (
        <EditarClienteModal
          cliente={editarCliente}
          onClose={() => setEditarCliente(null)}
          onSave={updated => setClientes(prev => prev.map(c => c.id === updated.id ? updated : c))}
        />
      )}
      {eliminarCliente && (
        <EliminarModal
          cliente={eliminarCliente}
          onClose={() => setEliminarCliente(null)}
          onConfirm={() => setClientes(prev => prev.filter(c => c.id !== eliminarCliente.id))}
        />
      )}

      {/* ── Barra de búsqueda y filtros ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por RUC, DNI o Nombre..."
            className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Filtro Estado */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
              className={cn(
                "appearance-none pl-3 pr-8 py-2.5 text-sm font-medium border rounded-xl outline-none cursor-pointer transition-all",
                filterStatus !== 'Todos'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600'
              )}
            >
              <option value="Todos">Estado: Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Filtro Tipo Doc */}
          <div className="relative">
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value as typeof filterTipo)}
              className={cn(
                "appearance-none pl-3 pr-8 py-2.5 text-sm font-medium border rounded-xl outline-none cursor-pointer transition-all",
                filterTipo !== 'Todos'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600'
              )}
            >
              <option value="Todos">Tipo Doc: Todos</option>
              <option value="RUC">RUC</option>
              <option value="DNI">DNI</option>
              <option value="CE">CE</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Limpiar filtros */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilterStatus('Todos'); setFilterTipo('Todos'); }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
            >
              <X size={12} /> Limpiar ({activeFilters})
            </button>
          )}
          <Button onClick={() => setIsNuevoOpen(true)}>
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* ── Contador de resultados ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Mostrando <span className="font-semibold text-gray-900">{filtered.length}</span> de <span className="font-semibold text-gray-900">{clientes.length}</span> clientes
        </p>
        {(search || activeFilters > 0) && filtered.length === 0 && (
          <p className="text-sm text-amber-600 font-medium">Sin resultados para esta búsqueda</p>
        )}
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Razón Social / Nombre</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Compra</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">
                    No se encontraron clientes con ese criterio.
                  </td>
                </tr>
              ) : filtered.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">{client.tipoDoc}</p>
                      <p className="text-sm font-mono text-gray-700">{client.doc}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{client.last}</td>
                  <td className="px-6 py-4">
                    <Badge variant={client.status === 'Activo' ? 'success' : 'default'}>{client.status}</Badge>
                  </td>
                  {/* ✅ Acciones horizontales directas */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                
                      <button
                        onClick={() => setCorreoCliente(client)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                        title="Enviar correo"
                      >
                        <Send size={12} /> Correo
                      </button>
                      <button
                        onClick={() => setEditarCliente(client)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap"
                        title="Editar"
                      >
                        <Edit2 size={12} /> 
                      </button>
                      <button
                        onClick={() => setEliminarCliente(client)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap"
                        title="Eliminar"
                      >
                        <Trash2 size={12} /> 
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Modal: Nuevo Cliente ──────────────────────────────────────────── */}
      <Modal isOpen={isNuevoOpen} onClose={() => setIsNuevoOpen(false)} title="Registrar Nuevo Cliente">
        <form className="space-y-4" onSubmit={handleNuevoSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipo Documento</label>
              <select
                value={nuevoForm.tipoDoc}
                onChange={e => setNuevoForm(f => ({ ...f, tipoDoc: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              >
                <option>RUC</option><option>DNI</option><option>CE</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
              <input
                type="text" value={nuevoForm.doc} onChange={e => setNuevoForm(f => ({ ...f, doc: e.target.value }))}
                placeholder="Ej: 20601234567"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Razón Social / Nombre Completo</label>
            <input
              type="text" value={nuevoForm.name} onChange={e => setNuevoForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Aceros SAC"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
            <input
              type="email" value={nuevoForm.email} onChange={e => setNuevoForm(f => ({ ...f, email: e.target.value }))}
              placeholder="cliente@ejemplo.com"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Dirección</label>
            <input
              type="text" value={nuevoForm.direccion} onChange={e => setNuevoForm(f => ({ ...f, direccion: e.target.value }))}
              placeholder="Dirección completa"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsNuevoOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Cliente</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}