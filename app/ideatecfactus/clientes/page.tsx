"use client";
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Plus, Eye, Send, Edit2, Trash2, X,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { cn } from '@/app/utils/cn';
import { ModalEliminar } from '@/app/components/ui/ModalEliminar';
import { AgregarCliente } from './gestionClientes/AgregarCliente';
import { EditarClienteModal } from './gestionClientes/EditarCliente';
import { EnviarCorreoCliente } from './gestionClientes/EnviarCorreoCliente';
import { Direccion, Cliente } from './gestionClientes/Cliente';


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
  const [clienteCorreo, setClienteCorreo] = useState<Cliente | null>(null);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);  
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
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [lengthErrors, setLengthErrors] = useState<Record<string, string>>({});

  // ── Cargar clientes desde la API ──
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/Cliente`); // reemplazar con tu URL real
        setClientes(response.data);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  const requiredFields = useMemo(() => {
    if (nuevoCliente.tipoDocumentoId === "01") {
      return [
        { key: "numeroDocumento", label: "Número de Documento", minLength: 8 },
        { key: "razonSocialNombre", label: "Nombre Completo" }
      ];
    } else if (nuevoCliente.tipoDocumentoId === "06") {
      return [
        { key: "numeroDocumento", label: "Número de Documento", minLength: 11 },
        { key: "razonSocialNombre", label: "Razón Social" },
        { key: "direccion.ubigeo", label: "Ubigeo" },
        { key: "direccion.direccionLineal", label: "Dirección" },
        { key: "direccion.distrito", label: "Distrito" },
        { key: "direccion.provincia", label: "Provincia" },
        { key: "direccion.departamento", label: "Departamento" },
      ];
    }
    return [];
  }, [nuevoCliente.tipoDocumentoId]);

  const validateAll = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    const newLengthErrors: Record<string, string> = {};

    requiredFields.forEach(field => {
      const value = field.key.includes('.')
        ? field.key.split('.').reduce((o: any, k) => o?.[k], nuevoCliente)
        : (nuevoCliente as any)[field.key];

      if (!value || value.trim() === '') {
        newErrors[field.key] = true;
        return;
      }

      // validar longitud solo si ya tiene contenido
      if (field.key === "numeroDocumento") {
        if (nuevoCliente.tipoDocumentoId === "01" && value.length !== 8) {
          newLengthErrors.numeroDocumento = "El DNI debe tener 8 dígitos";
        }

        if (nuevoCliente.tipoDocumentoId === "06" && value.length !== 11) {
          newLengthErrors.numeroDocumento = "El RUC debe tener 11 dígitos";
        }
      }
    });

    setErrors(newErrors);
    setLengthErrors(newLengthErrors);

    return Object.keys(newErrors).length === 0 && Object.keys(newLengthErrors).length === 0;
  };

  //N Crear Nuevo Cliente
  const handleNuevoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si hay algún campo obligatorio vacío, no continuar
    if (!validateAll()) return; 
    
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
      //console.log("Payload enviado a API:", payload);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/Cliente`, payload);
      setClientes(prev => [response.data, ...prev]);
      setNuevoCliente(nuevoClienteInicial);
      setErrors({}); // limpiar errores
      setIsNuevoOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
          alert(error.response.data.mensaje); 
          // o si usas toast: toast.error(error.response.data.mensaje)
      }
    }
  };

  const handleCancelarNuevo = () => {
    setNuevoCliente(nuevoClienteInicial);
    setErrors({});
    setLengthErrors({});
    setIsNuevoOpen(false);
  };

  const handleEliminar = async (clienteId: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/Cliente/${clienteId}`); // reemplazar
      setClientes(prev => prev.filter(c => c.clienteId !== clienteId));
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
    }
  };

  // ── Filtros ──
  const filtered = useMemo(() => clientes.filter(c => {
    const matchSearch =
      (c.razonSocialNombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.razonSocialNombre ?? "").includes(search);
    const estadoStr = c.estado ? 'Activo' : 'Inactivo';
    const matchStatus = filterStatus === 'Todos' || estadoStr === filterStatus;
    const matchTipo = filterTipo === 'Todos' || c.tipoDocumento.tipoDocumentoNombre === filterTipo;
    return matchSearch && matchStatus && matchTipo;
  }), [clientes, search, filterStatus, filterTipo]);

  const activeFilters = (filterStatus !== 'Todos' ? 1 : 0) + (filterTipo !== 'Todos' ? 1 : 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      {clienteCorreo && (
        <EnviarCorreoCliente
          cliente={clienteCorreo}
          onClose={() => setClienteCorreo(null)}
        />
      )}

      {clienteEditar && (
        <EditarClienteModal
          cliente={clienteEditar}
          onClose={() => setClienteEditar(null)}
          onSave={(clienteActualizado) => {
            setClientes(prev =>
              prev.map(c =>
                c.clienteId === clienteActualizado.clienteId
                  ? clienteActualizado
                  : c
              )
            );
          }}
        />
      )}
      {eliminarCliente && (
        <ModalEliminar
          isOpen={true}
          mensaje="Eliminarás permanentemente al cliente"
          nombre={eliminarCliente.razonSocialNombre}
          documento={eliminarCliente.numeroDocumento}
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
                        onClick={() => setClienteCorreo(client)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                        title="Enviar correo"
                      >
                        <Send size={12} /> Correo
                      </button>
                      <button
                        onClick={() => setClienteEditar(client)}
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
      <AgregarCliente
        isOpen={isNuevoOpen}
        nuevoCliente={nuevoCliente}
        errors={errors}
        lengthErrors={lengthErrors}
        setNuevoCliente={setNuevoCliente}
        setErrors={setErrors}
        setLengthErrors={setLengthErrors}
        handleNuevoSubmit={handleNuevoSubmit}
        handleCancelarNuevo={handleCancelarNuevo}
      />
    </div>
  );
}


