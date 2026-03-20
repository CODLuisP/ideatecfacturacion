"use client";
import { useRouter } from 'next/navigation';
import { Plus, Printer, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useEmpresaEmisor } from './gestionBoletas/useEmpresaEmisor';
import { useState, useEffect } from 'react';
import { Boleta, BoletaCliente } from './gestionBoletas/Boleta';
import { useClienteBoleta } from './gestionBoletas/useClienteBoleta';
import { useClientesLista } from './gestionBoletas/useClientesLista';
import { Cliente } from '../../clientes/gestionClientes/Cliente';

export default function BoletaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { empresa } = useEmpresaEmisor(user?.ruc ?? '');
  const { cliente, loadingCliente, errorCliente, buscarCliente } = useClienteBoleta();
  const { clientes, loadingLista } = useClientesLista();
  console.log('clientes:', clientes)

  const [tipoDoc, setTipoDoc] = useState('1')
  const [busqueda, setBusqueda] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const [boleta, setBoleta] = useState<Partial<Boleta>>({
    ublVersion: "2.1",
    tipoComprobante: "03",
    tipoMoneda: "PEN",
  });

  useEffect(() => {
    if (!empresa) return
    setBoleta(prev => ({ ...prev, company: empresa }))
  }, [empresa])

  useEffect(() => {
    if (!cliente) return
    setBoleta(prev => ({ ...prev, cliente: cliente as BoletaCliente }))
  }, [cliente])

  // Filtrar clientes de la lista según búsqueda y tipo doc seleccionado
  const clientesFiltrados = clientes.filter(c =>
    busqueda.length === 0
      ? true
      : c.numeroDocumento.includes(busqueda) ||
        c.razonSocialNombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Al seleccionar de la lista → llenar directo desde el objeto
  const seleccionarDeLista = (c: Cliente) => {
    setBusqueda(c.numeroDocumento)
    setShowDropdown(false)

    const direccion = c.direccion?.[0]
    setBoleta(prev => ({
      ...prev,
      cliente: {
        clienteId: c.clienteId,
        tipoDocumento: c.tipoDocumento.tipoDocumentoId,
        numeroDocumento: c.numeroDocumento,
        razonSocial: c.razonSocialNombre,
        ubigeo: direccion?.ubigeo ?? '',
        direccionLineal: direccion?.direccionLineal ?? '',
        departamento: direccion?.departamento ?? '',
        provincia: direccion?.provincia ?? '',
        distrito: direccion?.distrito ?? '',
      }
    }))
  }

  // Al terminar de escribir el número completo y no está en lista → buscar SUNAT
  useEffect(() => {
    const longitud = tipoDoc === '1' ? 8 : tipoDoc === '6' ? 11 : 0
    if (!longitud || busqueda.length !== longitud) return

    const yaEstaEnLista = clientes.some(c => c.numeroDocumento === busqueda)
    if (!yaEstaEnLista) {
      buscarCliente(tipoDoc, busqueda)
    }
  }, [busqueda, tipoDoc, clientes])

  console.log(boleta)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" onClick={() => router.push('/ideatecfactus/emision')} className="h-10 w-10 p-0 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Nueva Boleta de Venta</h3>
          <p className="text-sm text-gray-500">Regresar a selección de comprobante</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Datos del Comprobante" subtitle="Completa la información requerida">
            <form className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Bloque cliente */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tipo y Nº Documento</label>
                  <div className="flex gap-2">

                    {/* Select tipo doc */}
                    <select
                      value={tipoDoc}
                      onChange={(e) => {
                        setTipoDoc(e.target.value)
                        setBusqueda('')
                        setShowDropdown(false)
                      }}
                      className="w-1/3 py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm"
                    >
                      <option value="1">DNI</option>
                      <option value="6">RUC</option>
                      <option value="4">CE</option>
                    </select>

                    {/* Input + dropdown */}
                    <div className="relative w-2/3">
                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => {
                          setBusqueda(e.target.value)
                          setShowDropdown(true)
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                        maxLength={tipoDoc === '1' ? 8 : tipoDoc === '6' ? 11 : 12}
                        placeholder="Buscar por nº doc o nombre..."
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-sm"
                      />

                      {loadingCliente && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                      )}

                      {/* Dropdown */}
                      {showDropdown && (
                        <div className="absolute z-50 top-full mt-1 w-70 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {loadingLista ? (
                            <p className="text-xs text-gray-400 px-4 py-3">Cargando clientes...</p>
                          ) : clientesFiltrados.length === 0 ? (
                            <p className="text-xs text-gray-400 px-4 py-3">No se encontraron resultados</p>
                          ) : (
                            clientesFiltrados.map(c => (
                              <button
                                key={c.clienteId}
                                type="button"
                                onMouseDown={() => seleccionarDeLista(c)}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                              >
                                <span className="text-sm text-gray-800">
                                  {c.numeroDocumento} - {c.razonSocialNombre}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nombre solo lectura */}
                  <input
                    type="text"
                    disabled
                    value={boleta.cliente?.razonSocial ?? ''}
                    placeholder={loadingCliente ? 'Buscando en SUNAT...' : 'Nombre o razón social'}
                    className="w-full py-2.5 px-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 text-sm"
                  />
                  {errorCliente && <p className="text-xs text-red-500">{errorCliente}</p>}
                </div>

                {/* Serie y número */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Serie y Número</label>
                  <div className="flex gap-2">
                    <select className="w-1/3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                      <option>B001</option>
                      <option>B002</option>
                    </select>
                    <input type="text" disabled value="0000089" className="w-2/3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl px-4 text-gray-500 font-mono" />
                  </div>
                </div>
              </div>

              {/* Fecha y moneda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Fecha de Emisión</label>
                  <input type="date" className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Moneda</label>
                  <select className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue">
                    <option>PEN - Soles</option>
                    <option>USD - Dólares</option>
                  </select>
                </div>
              </div>

              {/* Ítems */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase">Ítems / Productos</label>
                  <Button variant="ghost" className="h-8 text-xs text-brand-blue"><Plus className="w-3 h-3 mr-1" /> Agregar ítem</Button>
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
                        <td className="px-4 py-3">Producto de ejemplo</td>
                        <td className="px-4 py-3 text-center">2</td>
                        <td className="px-4 py-3 text-right">50.00</td>
                        <td className="px-4 py-3 text-right font-semibold">100.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => router.push('/emision')}>Cancelar</Button>
                <div className="space-y-2 text-right">
                  <div className="flex justify-end gap-8 text-sm text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-medium text-gray-900">S/ 84.75</span>
                  </div>
                  <div className="flex justify-end gap-8 text-sm text-gray-500">
                    <span>IGV (18%):</span>
                    <span className="font-medium text-gray-900">S/ 15.25</span>
                  </div>
                  <div className="flex justify-end gap-8 text-lg font-bold text-brand-blue">
                    <span>Total:</span>
                    <span>S/ 100.00</span>
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
}