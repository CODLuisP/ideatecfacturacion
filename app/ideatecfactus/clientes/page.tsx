"use client";
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
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
interface Direccion {
  direccionId: number
  direccionLineal: string
  ubigeo: string
  departamento: string
  provincia: string
  distrito: string
  tipoDireccion: string
}

interface TipoDocumento {
  tipoDocumentoId: string
  tipoDocumentoNombre: string
}

interface Cliente {
  clienteId: number
  razonSocialNombre: string
  numeroDocumento: string
  nombreComercial: string | null
  fechaCreacion: string
  telefono: string | null
  correo: string | null
  estado: boolean
  tipoDocumento: TipoDocumento
  direccion: Direccion[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDireccion = (direcciones: Direccion[]): string => {
  if (!direcciones || direcciones.length === 0) return 'Sin dirección';
  const d = direcciones[0];
  const partes = [d.direccionLineal, d.distrito, d.provincia, d.departamento].filter(Boolean);
  return partes.length > 0 ? partes.join(' - ') : 'Sin dirección';
};

const formatFecha = (fecha: string | null): string => {
  if (!fecha) return '-';
  try {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    return '-';
  }
};

// ─── Page Principal ────────────────────────────────────────────────────────────
export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos');
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'RUC' | 'DNI' | 'CE'>('Todos');

  const [isNuevoOpen, setIsNuevoOpen] = useState(false);
  const [correoCliente, setCorreoCliente] = useState<Cliente | null>(null);
  const [editarCliente, setEditarCliente] = useState<Cliente | null>(null);
  const [eliminarCliente, setEliminarCliente] = useState<Cliente | null>(null);

  // ── Nuevo cliente form ──
  const nuevoClienteInicial = {
    tipoDocumentoId: '01',
    numeroDocumento: '',
    razonSocialNombre: '',
    nombreComercial: '',
    correo: '',
    telefono: '',
    direccion: {
      ubigeo: '',
      direccionLineal: '',
      departamento: '',
      provincia: '',
      distrito: '',
      tipoDireccion: ''
    }
  };
  const [nuevoCliente, setNuevoCliente] = useState(nuevoClienteInicial);

  // ── Cargar clientes desde la API ──
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5004/Cliente'); // reemplazar con tu URL real
        setClientes(response.data);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  //N Crear Nuevo Cliente
  const handleNuevoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        if (nuevoCliente.tipoDocumentoId === "01" && nuevoCliente.numeroDocumento.length !== 8) {
          alert("El DNI debe tener 8 dígitos");
          return;
        }

        if (nuevoCliente.tipoDocumentoId === "06" && nuevoCliente.numeroDocumento.length !== 11) {
          alert("El RUC debe tener 11 dígitos");
          return;
        }
      let payload: any = {
        numeroDocumento: nuevoCliente.numeroDocumento,
        razonSocialNombre: nuevoCliente.razonSocialNombre,
        tipoDocumentoId: nuevoCliente.tipoDocumentoId
      };

      // ── DNI ──
      if (nuevoCliente.tipoDocumentoId === "01") {
        if (nuevoCliente.correo) {
          payload.correo = nuevoCliente.correo;
        }
        if (nuevoCliente.telefono) {
          payload.telefono = nuevoCliente.telefono;
        }
      }

      // ── RUC ──
      if (nuevoCliente.tipoDocumentoId === "06") {
        payload = {
          ...payload,
          nombreComercial: nuevoCliente.nombreComercial,
          telefono: nuevoCliente.telefono,
          correo: nuevoCliente.correo,
          direccion: {
            ubigeo: nuevoCliente.direccion.ubigeo,
            direccionLineal: nuevoCliente.direccion.direccionLineal,
            departamento: nuevoCliente.direccion.departamento,
            provincia: nuevoCliente.direccion.provincia,
            distrito: nuevoCliente.direccion.distrito,
            tipoDireccion: nuevoCliente.direccion.tipoDireccion
          }
        };
      }
      console.log("Payload enviado a API:", payload);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/Cliente`, payload);
      setClientes(prev => [response.data, ...prev]);
      setNuevoCliente(nuevoClienteInicial);
      setIsNuevoOpen(false);
    } catch (error) {
      console.error('Error al crear cliente:', error);
    }
  };

  const handleCancelarNuevo = () => {
    setNuevoCliente(nuevoClienteInicial);
    setIsNuevoOpen(false);
  };

  const handleEliminar = async (clienteId: number) => {
    try {
      await axios.delete(`http://localhost:5004/Cliente/${clienteId}`); // reemplazar
      setClientes(prev => prev.filter(c => c.clienteId !== clienteId));
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
    }
  };

  // ── Filtros ──
  const filtered = useMemo(() => clientes.filter(c => {
    const matchSearch =
      c.razonSocialNombre.toLowerCase().includes(search.toLowerCase()) ||
      c.numeroDocumento.includes(search) ||
      (c.correo ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.nombreComercial ?? '').toLowerCase().includes(search.toLowerCase());
    const estadoStr = c.estado ? 'Activo' : 'Inactivo';
    const matchStatus = filterStatus === 'Todos' || estadoStr === filterStatus;
    const matchTipo = filterTipo === 'Todos' || c.tipoDocumento.tipoDocumentoNombre === filterTipo;
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
          onSave={updated => setClientes(prev => prev.map(c => c.clienteId === updated.clienteId ? updated : c))}
        />
      )}
      {eliminarCliente && (
        <EliminarModal
          cliente={eliminarCliente}
          onClose={() => setEliminarCliente(null)}
          onConfirm={() => handleEliminar(eliminarCliente.clienteId)}
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre Comercial</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-gray-400">
                    Cargando clientes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-gray-400">
                    No se encontraron clientes con ese criterio.
                  </td>
                </tr>
              ) : filtered.map((client) => (
                <tr key={client.clienteId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">{client.tipoDocumento.tipoDocumentoNombre}</p>
                      <p className="text-sm font-mono text-gray-700">{client.numeroDocumento}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{client.razonSocialNombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.nombreComercial ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 " title={formatDireccion(client.direccion)}>
                    {formatDireccion(client.direccion)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.correo ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.telefono ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatFecha(client.fechaCreacion)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={client.estado ? 'success' : 'default'}>
                      {client.estado ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
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
                value={nuevoCliente.tipoDocumentoId}
                onChange={e => setNuevoCliente(f => ({ ...f, tipoDocumentoId: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              >
                <option value="01">DNI</option>
                <option value="06">RUC</option>
                <option value="07">CE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
              <input
                type="text"
                value={nuevoCliente.numeroDocumento}
                  onChange={e => {
                  const soloNumeros = e.target.value.replace(/\D/g, "");
                  const limite =
                    nuevoCliente.tipoDocumentoId === "01" ? 8 : 11
                  setNuevoCliente(f => ({...f, numeroDocumento: soloNumeros.slice(0, limite)}));
                }}
                placeholder={nuevoCliente.tipoDocumentoId === "06" ? "Ej:20512134832"  : "Ej:87654321"}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase"> {nuevoCliente.tipoDocumentoId === "06" ? <>Razón Social</>  : <>Nombre Completo </>}</label>
            <input
              type="text"
              value={nuevoCliente.razonSocialNombre}
              onChange={e => setNuevoCliente(f => ({ ...f, razonSocialNombre: e.target.value }))}
              placeholder={nuevoCliente.tipoDocumentoId === "06" ? "Ej: Aceros S.A.C."  : "Ej: Juan Perez Neira"}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              required
            />
          </div>

          {nuevoCliente.tipoDocumentoId === "06" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Nombre Comercial <span className="text-gray-400 normal-case font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={nuevoCliente.nombreComercial}
                onChange={e => setNuevoCliente(f => ({ ...f, nombreComercial: e.target.value }))}
                placeholder="Ej: Aceros del Norte"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>)
          }

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Correo Electrónico <span className="text-gray-400 normal-case font-normal">(opcional)</span>
            </label>
            <input
              type="email"
              value={nuevoCliente.correo}
              onChange={e => setNuevoCliente(f => ({ ...f, correo: e.target.value }))}
              placeholder="cliente@ejemplo.com"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Teléfono <span className="text-gray-400 normal-case font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={nuevoCliente.telefono}
              onChange={e => setNuevoCliente(f => ({ ...f, telefono: e.target.value }))}
              placeholder="Ej: 987654321"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
            />
          </div>

          {/* ── Dirección (solo para RUC) ── */}
          {nuevoCliente.tipoDocumentoId === "06" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Ubigego <span className="text-gray-400 normal-case font-normal"></span>
                </label>
                <input
                  type="text"
                  placeholder="Ubigeo"
                  value={nuevoCliente.direccion.ubigeo}
                  onChange={e =>
                    setNuevoCliente(f => ({
                      ...f,
                      direccion: { ...f.direccion, ubigeo: e.target.value }
                    }))
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Dirección <span className="text-gray-400 normal-case font-normal"></span>
                </label>
                <input
                type="text"
                placeholder="Ej: Av. Perú n° 123"
                value={nuevoCliente.direccion.direccionLineal}
                onChange={e =>
                  setNuevoCliente(f => ({
                    ...f,
                    direccion: { ...f.direccion, direccionLineal: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Distrito <span className="text-gray-400 normal-case font-normal"></span>
                </label>
                <input
                type="text"
                placeholder="Distrito"
                value={nuevoCliente.direccion.distrito}
                onChange={e =>
                  setNuevoCliente(f => ({
                    ...f,
                    direccion: { ...f.direccion, distrito: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Provincia <span className="text-gray-400 normal-case font-normal"></span>
                </label>
                <input
                type="text"
                placeholder="Provincia"
                value={nuevoCliente.direccion.provincia}
                onChange={e =>
                  setNuevoCliente(f => ({
                    ...f,
                    direccion: { ...f.direccion, provincia: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Departamento <span className="text-gray-400 normal-case font-normal"></span>
                </label>
                <input
                type="text"
                placeholder="Departamento"
                value={nuevoCliente.direccion.departamento}
                onChange={e =>
                  setNuevoCliente(f => ({
                    ...f,
                    direccion: { ...f.direccion, departamento: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Tipo Dirección <span className="text-gray-400 normal-case font-normal"></span>
                </label>
                <input
                type="text"
                placeholder="Dirección fiscal"
                value={nuevoCliente.direccion.tipoDireccion}
                onChange={e =>
                  setNuevoCliente(f => ({
                    ...f,
                    direccion: { ...f.direccion, tipoDireccion: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={handleCancelarNuevo}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cliente</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

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
    <Modal isOpen onClose={onClose} title={`Enviar correo a ${cliente.razonSocialNombre}`}>
      {sent ? (
        <div className="text-center py-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <p className="font-bold text-slate-900 mb-1">¡Correo enviado!</p>
          <p className="text-sm text-slate-500 mb-5">Mensaje enviado a <span className="font-semibold">{cliente.correo}</span></p>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
            <Mail size={14} className="text-slate-400" />
            <span className="text-slate-500">Para:</span>
            <span className="font-semibold text-slate-800">{cliente.correo ?? '-'}</span>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // ── payload cliente ──
      const payloadCliente = {
        clienteId: form.clienteId,
        razonSocialNombre: form.razonSocialNombre,
        numeroDocumento: form.numeroDocumento,
        nombreComercial: form.nombreComercial,
        telefono: form.telefono,
        correo: form.correo
      };
      const responseCliente = await axios.put(`http://localhost:5004/Cliente/${form.clienteId}`, payloadCliente);

      // ── si es RUC editar dirección ──
      if (form.tipoDocumento.tipoDocumentoId === "06" && form.direccion) {

        const payloadDireccion = {
          direccionId: form.direccion[0].direccionId,
          direccionLineal: form.direccion[0].direccionLineal,
          ubigeo: form.direccion[0].ubigeo,
          departamento: form.direccion[0].departamento,
          provincia: form.direccion[0].provincia,
          distrito: form.direccion[0].distrito,
          tipoDireccion: form.direccion[0].tipoDireccion
        };

        await axios.put(`http://localhost:5004/api/Direccion/${form.direccion[0].direccionId}`,payloadDireccion);
      }

      onSave(responseCliente.data);
      onClose();

    } catch (error) {
      console.error('Error al editar cliente:', error);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Editar Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Tipo Documento</label>
            <select
              value={form.tipoDocumento.tipoDocumentoId}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
            >
              <option value="01">DNI</option>
              <option value="06">RUC</option>
              <option value="07">CE</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
            <input
              type="text"
              value={form.numeroDocumento}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
            />
          </div>

        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">
            {form.tipoDocumento.tipoDocumentoId === "06" ? "Razón Social" : "Nombre Completo"}
          </label>
          <input
            type="text"
            value={form.razonSocialNombre}
            onChange={e => setForm(f => ({ ...f, razonSocialNombre: e.target.value }))}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          />
        </div>

        {form.tipoDocumento.tipoDocumentoId === "06" && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Nombre Comercial</label>
            <input
              type="text"
              value={form.nombreComercial ?? ''}
              onChange={e => setForm(f => ({ ...f, nombreComercial: e.target.value || null }))}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
          <input
            type="email"
            value={form.correo ?? ''}
            onChange={e => setForm(f => ({ ...f, correo: e.target.value || null }))}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
          <input
            type="text"
            value={form.telefono ?? ''}
            onChange={e => setForm(f => ({ ...f, telefono: e.target.value || null }))}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
          />
        </div>

        {/* ── Dirección solo para RUC ── */}

        {form.tipoDocumento.tipoDocumentoId === "06" && form.direccion && (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Ubigeo</label>
              <input
                type="text"
                value={form.direccion[0].ubigeo ?? ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    direccion: { ...f.direccion, ubigeo: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Dirección</label>
              <input
                type="text"
                value={form.direccion[0].direccionLineal ?? ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    direccion: { ...f.direccion, direccionLineal: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Distrito</label>
              <input
                type="text"
                value={form.direccion[0].distrito ?? ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    direccion: { ...f.direccion, distrito: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Provincia</label>
              <input
                type="text"
                value={form.direccion[0].provincia ?? ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    direccion: { ...f.direccion, provincia: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Departamento</label>
              <input
                type="text"
                value={form.direccion[0].departamento ?? ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    direccion: { ...f.direccion, departamento: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipo Dirección</label>
              <input
                type="text"
                value={form.direccion[0].tipoDireccion ?? ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    direccion: { ...f.direccion, tipoDireccion: e.target.value }
                  }))
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
              />
            </div>

          </div>
        )}

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
            Eliminarás permanentemente a <strong>{cliente.razonSocialNombre}</strong> ({cliente.numeroDocumento}). Esta acción no se puede deshacer.
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