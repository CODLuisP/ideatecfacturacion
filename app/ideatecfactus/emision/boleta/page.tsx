"use client";
import { useRouter } from 'next/navigation';
import { Plus, Printer, ShieldCheck, ChevronLeft, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useEmpresaEmisor } from './gestionBoletas/useEmpresaEmisor';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Boleta, BoletaCliente, BoletaDetalle, BoletaPago, BoletaCuota, BoletaGuia } from './gestionBoletas/Boleta';
import { useClienteBoleta } from './gestionBoletas/useClienteBoleta';
import { useClientesLista } from './gestionBoletas/useClientesLista';
import { Cliente } from '../../clientes/gestionClientes/Cliente';
import { useSucursal } from './gestionBoletas/useSucursal';
import { formatoFechaActual } from '@/app/components/ui/formatoFecha';
import { ProductoSucursal } from '../../productos/gestioProductos/Producto';
import { useProductosSucursal } from '../../productos/gestioProductos/useProductosSucursal';
import axios from 'axios';
import { numeroALetras } from '@/app/components/ui/numeroALetras';
import { useToast } from '@/app/components/ui/Toast';

// Tipo local para manejar incluirIGV por fila
interface DetalleLocal extends Partial<BoletaDetalle> {
  _incluirIGV?: boolean
  _precioBase?: number // precio original sin IGV del producto
}

// Tipo local para pagos
interface PagoLocal {
  medioPago: string
  monto: string
  numeroOperacion: string
  entidadFinanciera: string
  observaciones: string
}

export default function BoletaPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const RUC = "20331066703";
  const SUCURSAL_ID = 1;

  const { empresa } = useEmpresaEmisor(RUC ?? '');
  const { cliente, loadingCliente, errorCliente, buscarCliente } = useClienteBoleta();
  const { clientes, loadingLista } = useClientesLista(RUC ?? "");
  const { sucursal } = useSucursal(SUCURSAL_ID);
  const { productosSucursal } = useProductosSucursal(SUCURSAL_ID);

  const { fecha, fechaHora } = formatoFechaActual();

  // ── Cliente ──────────────────────────────────────────────────
  const [tipoDoc, setTipoDoc] = useState('01');
  const [busqueda, setBusqueda] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // ── Reloj ────────────────────────────────────────────────────
  const [horaDisplay, setHoraDisplay] = useState(fechaHora);
  const [fechaEmisionEditada, setFechaEmisionEditada] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  //emitir
  const [emitiendo, setEmitiendo] = useState(false)
  const [errorEmision, setErrorEmision] = useState<string | null>(null)

  const emitirComprobante = async () => {
    setEmitiendo(true)
    setErrorEmision(null)

    try {
      const boletaFinal = prepararBoleta()

      // 1. Crear boleta en BD
      const resBoleta = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/GenerarXml`,
        boletaFinal
      )
      const comprobanteId = resBoleta.data.comprobanteId;
      console.log("id devuelto", comprobanteId)

      // 2. Enviar a SUNAT con el id creado
      const resSunat = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobanteId}/enviar-sunat`
      )

      console.log('respuesta SUNAT:', resSunat.data)
      showToast(resSunat.data.mensaje , 'success');
      
    } catch (err: any) {
      setErrorEmision(err?.response?.data?.message ?? 'Error al emitir el comprobante')
      console.error(err)
    } finally {
      setEmitiendo(false)
    }
  }

  useEffect(() => {
    if (fechaEmisionEditada) {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      return;
    }
    intervaloRef.current = setInterval(() => {
      setHoraDisplay(formatoFechaActual().fechaHora);
    }, 1000);
    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current); };
  }, [fechaEmisionEditada]);

  // ── Pagos (contado / inicial) ────────────────────────────────
  const [pagos, setPagos] = useState<PagoLocal[]>([
    { medioPago: 'Efectivo', monto: '', numeroOperacion: '', entidadFinanciera: '', observaciones: '' }
  ]);

  const [pagosEditados, setPagosEditados] = useState<boolean[]>([false])
  const pagosEditadosRef = useRef<boolean[]>([false])

  useEffect(() => {
    pagosEditadosRef.current = pagosEditados
  }, [pagosEditados])

  const mediosUsados = pagos.map(p => p.medioPago);
  const todosMedios = ['Efectivo', 'Tarjeta', 'Yape', 'Plin', 'Transferencia'];
  const totalPagado = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

  const agregarPago = () => {
    const disponibles = todosMedios.filter(m => !mediosUsados.includes(m));
    if (!disponibles.length) return;
    setPagos(prev => [...prev, { medioPago: disponibles[0], monto: '', numeroOperacion: '', entidadFinanciera: '', observaciones: '' }]);
    setPagosEditados(prev => [...prev, false])
  };

  const eliminarPago = (i: number) => {
    if (pagos.length === 1) return;
    setPagos(prev => prev.filter((_, idx) => idx !== i));
    setPagosEditados(prev => prev.filter((_, idx) => idx !== i))
  };

  const actualizarPago = (i: number, campo: keyof PagoLocal, valor: string) => {
    setPagos(prev => { const n = [...prev]; n[i] = { ...n[i], [campo]: valor }; return n; });
  };

  // ── Crédito ──────────────────────────────────────────────────
  const [numeroCuotas, setNumeroCuotas] = useState(1);
  const [cuotas, setCuotas] = useState<{ numeroCuota: string; monto: string; fechaVencimiento: string }[]>([]);

  useEffect(() => {
    setCuotas(Array.from({ length: numeroCuotas }, (_, i) => ({
      numeroCuota: `Cuota${String(i + 1).padStart(3, '0')}`,
      monto: '', fechaVencimiento: fecha,
    })));
  }, [numeroCuotas]);

  // ── Ítems ────────────────────────────────────────────────────
  const [detalles, setDetalles] = useState<DetalleLocal[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState<string[]>([]);
  const [showDropdownProducto, setShowDropdownProducto] = useState<boolean[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Descuento global ─────────────────────────────────────────
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);

  // ── Guías ────────────────────────────────────────────────────
  const [showGuias, setShowGuias] = useState(false);
  const [guias, setGuias] = useState<{ serie: string; numero: string; tipoDoc: string }[]>([]);

  const agregarGuia = () => setGuias(prev => [...prev, { serie: '', numero: '', tipoDoc: '09' }]);
  const eliminarGuia = (i: number) => setGuias(prev => prev.filter((_, idx) => idx !== i));
  const actualizarGuia = (i: number, campo: string, valor: string) => {
    setGuias(prev => { const n = [...prev]; n[i] = { ...n[i], [campo]: valor }; return n; });
  };

  // ── Boleta state ─────────────────────────────────────────────
  const [boleta, setBoleta] = useState<Partial<Boleta>>({
    ublVersion: "2.1",
    tipoOperacion: "0101",
    tipoComprobante: "03",
    tipoMoneda: "PEN",
    fechaEmision: fechaHora,
    horaEmision: fechaHora,
    fechaVencimiento: fecha,
    tipoPago: "Contado",
  });

  // ── Effects ──────────────────────────────────────────────────
  useEffect(() => { if (!empresa) return; setBoleta(prev => ({ ...prev, company: empresa })); }, [empresa]);
  useEffect(() => { if (!cliente) return; setBoleta(prev => ({ ...prev, cliente: cliente as BoletaCliente })); }, [cliente]);
  useEffect(() => {
    if (!sucursal) return;
    setBoleta(prev => ({ ...prev, serie: sucursal.serieBoleta, correlativo: String(sucursal.correlativoBoleta).padStart(8, '0') }));
  }, [sucursal]);

  // Pagos → boleta
  useEffect(() => {
    if (boleta.tipoPago !== 'Contado' && boleta.tipoPago !== 'CreditoInicial') return;
    const pagosFormateados: BoletaPago[] = pagos.map(p => ({
      medioPago: p.medioPago, monto: Number(p.monto) || 0,
      fechaPago: fechaHora,
      numeroOperacion: p.medioPago === 'Efectivo' ? '' : p.numeroOperacion,
      entidadFinanciera: p.medioPago === 'Efectivo' ? '' : p.entidadFinanciera,
      observaciones: p.observaciones,
    }));
    setBoleta(prev => ({ ...prev, pagos: pagosFormateados, cuotas: [] }));
  }, [pagos, boleta.tipoPago]);

  // Cuotas → boleta
  useEffect(() => {
    if (boleta.tipoPago !== 'Credito' && boleta.tipoPago !== 'CreditoInicial') return;
    const cuotasFormateadas: BoletaCuota[] = cuotas.map(c => ({
      numeroCuota: c.numeroCuota, monto: Number(c.monto) || 0,
      fechaVencimiento: c.fechaVencimiento, montoPagado: '', fechaPago: '', estado: 'Pendiente',
    }));
    if (boleta.tipoPago === 'Credito') {
      setBoleta(prev => ({ ...prev, cuotas: cuotasFormateadas, pagos: [] }));
    } else {
      setBoleta(prev => ({ ...prev, cuotas: cuotasFormateadas }));
    }
  }, [cuotas, boleta.tipoPago]);

  // Detalles → boleta
  useEffect(() => {
    const detallesLimpios = detalles.map(({ _incluirIGV, _precioBase, ...d }) => d) as BoletaDetalle[];
    setBoleta(prev => ({ ...prev, details: detallesLimpios }));
  }, [detalles]);

  // Guías → boleta
  useEffect(() => {
    const guiasFormateadas: BoletaGuia[] = guias
      .filter(g => g.serie && g.numero)
      .map(g => ({ guiaNumeroCompleto: `${g.serie}-${g.numero}`, guiaTipoDoc: g.tipoDoc }));
    setBoleta(prev => ({ ...prev, guias: guiasFormateadas }));
  }, [guias]);

  // ── Totales ──────────────────────────────────────────────────
  const totales = useMemo(() => {
    const gravadas = detalles.filter(d => d.tipoAfectacionIGV === '10').reduce((acc, d) => acc + (d.valorVenta ?? 0), 0);
    const exoneradas = detalles.filter(d => d.tipoAfectacionIGV === '20').reduce((acc, d) => acc + (d.totalVentaItem ?? 0), 0);
    const inafectas = detalles.filter(d => d.tipoAfectacionIGV === '30').reduce((acc, d) => acc + (d.totalVentaItem ?? 0), 0);
    const igv = detalles.filter(d => d.tipoAfectacionIGV === '10').reduce((acc, d) => acc + (d.montoIGV ?? 0), 0);
    const totalDescuentos = detalles.reduce((acc, d) => acc + (d.descuentoTotal ?? 0), 0);
    const subtotal = parseFloat((gravadas + exoneradas + inafectas + igv).toFixed(2));
    const valorVenta = parseFloat((gravadas + exoneradas + inafectas).toFixed(2));
    const total = parseFloat(Math.max(0, subtotal - totalDescuentos - descuentoGlobal).toFixed(2));
    return {
      gravadas: parseFloat(gravadas.toFixed(2)),
      exoneradas: parseFloat(exoneradas.toFixed(2)),
      inafectas: parseFloat(inafectas.toFixed(2)),
      igv: parseFloat(igv.toFixed(2)),
      totalDescuentos: parseFloat(totalDescuentos.toFixed(2)),
      subtotal,
      valorVenta,
      total,
    };
  }, [detalles, descuentoGlobal]);

  //actulizar monto de pago
  useEffect(() => {
    if (totales.total === 0) return
    if (boleta.tipoPago !== 'Contado' && boleta.tipoPago !== 'CreditoInicial') return
    setPagos(prev => prev.map((pago, i) => {
      if (pagosEditadosRef.current[i]) return pago
      const pagadoAntes = prev.slice(0, i).reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
      const restante = Math.max(0, totales.total - descuentoGlobal - pagadoAntes).toFixed(2)
      return { ...pago, monto: restante }
    }))
  }, [totales.total, descuentoGlobal, boleta.tipoPago])
 
  //para actualizar monto en creditos
  useEffect(() => {
    if (boleta.tipoPago !== 'Credito' && boleta.tipoPago !== 'CreditoInicial') return
    if (totales.total === 0) return
    const montoPorCuota = parseFloat((totales.total / numeroCuotas).toFixed(2))
    setCuotas(prev => prev.map(cuota => {
      if (cuota.monto !== '') return cuota
      return { ...cuota, monto: String(montoPorCuota) }
    }))
  }, [totales.total, numeroCuotas, boleta.tipoPago])


  useEffect(() => {
    // Legend automático — importe en letras lo genera el backend, solo enviamos code 1000
    const moneda = boleta.tipoMoneda === 'USD' ? 'DÓLARES' : 'SOLES'
    const legend = [{ code: '1000', value: numeroALetras(totales.total, moneda) }]
    const montoCredito = boleta.tipoPago === 'CreditoInicial'
      ? parseFloat(Math.max(0, totales.total - totalPagado).toFixed(2)) : 0;

    setBoleta(prev => ({
      ...prev,
      totalOperacionesGravadas: totales.gravadas,
      totalOperacionesExoneradas: totales.exoneradas,
      totalOperacionesInafectas: totales.inafectas,
      totalIGV: totales.igv,
      totalImpuestos: totales.igv,
      totalDescuentos: totales.totalDescuentos, //adicionamos en descuento global
      descuentoGlobal,
      subTotal: totales.gravadas + totales.exoneradas + totales.inafectas,
      importeTotal: totales.total,
      valorVenta: totales.valorVenta,
      montoCredito,
      legends: legend,
    }));
  }, [totales, descuentoGlobal, boleta.tipoPago, totalPagado]);

  // ── Clientes ─────────────────────────────────────────────────
  const clientesFiltrados = clientes.filter(c => {
    if (c.tipoDocumento.tipoDocumentoId !== tipoDoc) return false;
    if (busqueda.length === 0) return true;
    return c.numeroDocumento.includes(busqueda) || c.razonSocialNombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const seleccionarDeLista = (c: Cliente) => {
    setBusqueda(c.numeroDocumento);
    setShowDropdown(false);
    const direccion = c.direccion?.[0];
    setBoleta(prev => ({
      ...prev,
      cliente: {
        clienteId: c.clienteId, tipoDocumento: c.tipoDocumento.tipoDocumentoId,
        numeroDocumento: c.numeroDocumento, razonSocial: c.razonSocialNombre,
        ubigeo: direccion?.ubigeo ?? '', direccionLineal: direccion?.direccionLineal ?? '',
        departamento: direccion?.departamento ?? '', provincia: direccion?.provincia ?? '',
        distrito: direccion?.distrito ?? '',
      }
    }));
  };

  useEffect(() => {
    const longitud = tipoDoc === '01' ? 8 : tipoDoc === '06' ? 11 : 0;
    if (!longitud || busqueda.length !== longitud) return;
    const yaEsta = clientes.some(c => c.numeroDocumento === busqueda);
    if (!yaEsta) buscarCliente(tipoDoc, busqueda);
  }, [busqueda, tipoDoc, clientes]);

  // ── Cálculo de detalle ───────────────────────────────────────
  const calcularDetalle = useCallback((
    precioBase: number,   // siempre precio SIN IGV
    cantidad: number,
    porcentajeIGV: number,
    tipoAfectacion: string,
    precioVentaOriginal: number, // precio con IGV (del sistema)
    descuentoUnitario: number = 0
  ) => {
    // precioUnitario = precio sin IGV
    const precioUnitario = parseFloat(precioBase.toFixed(6));

    // descuento se aplica sobre precioVenta (con IGV)
    const precioVenta = parseFloat((precioVentaOriginal - descuentoUnitario).toFixed(2));

    let baseIgv = 0, montoIGV = 0, totalVentaItem = 0, valorVenta = 0;
    const descuentoTotal = parseFloat((descuentoUnitario * cantidad).toFixed(2));
    if (tipoAfectacion === '10') {
      // gravado
      baseIgv = parseFloat((precioUnitario * cantidad).toFixed(2));   // valorVenta = baseIgv
      montoIGV = parseFloat((baseIgv * porcentajeIGV / 100).toFixed(2));
      totalVentaItem = parseFloat((precioVenta * cantidad).toFixed(2));
      valorVenta = baseIgv;
    } else {
      // exonerado / inafecto
      baseIgv = parseFloat((precioUnitario * cantidad).toFixed(2));
      montoIGV = 0;
      totalVentaItem = parseFloat((precioVenta * cantidad).toFixed(2));
      valorVenta = baseIgv;
      precioVenta === precioVentaOriginal; // no aplica descuento distinto
    }

    return { precioUnitario, precioVenta, baseIgv, montoIGV, totalVentaItem, valorVenta, descuentoTotal };
  }, []);

  // ── Agregar fila ─────────────────────────────────────────────
  const agregarFila = () => {
    setDetalles(prev => [...prev, {
      item: prev.length + 1,
      productoId: 0, codigo: '', descripcion: '', cantidad: 1, unidadMedida: '',
      precioUnitario: 0, tipoAfectacionIGV: '10', porcentajeIGV: 18,
      montoIGV: 0, baseIgv: 0, codigoTipoDescuento: '01', descuentoUnitario: 0,
      descuentoTotal: 0, valorVenta: 0, precioVenta: 0, totalVentaItem: 0,
      icbper: 0, factorIcbper: 0, _incluirIGV: false, _precioBase: 0,
    }]);
    setBusquedaProducto(prev => [...prev, '']);
    setShowDropdownProducto(prev => [...prev, false]);
    inputRefs.current = [...inputRefs.current, null];
  };

  // ── Seleccionar producto ─────────────────────────────────────
  const seleccionarProducto = (producto: ProductoSucursal, index: number) => {
    const precioConIGV = producto.sucursalProducto.precioUnitario;
    const porcentajeIGV = 18;
    const cantidad = detalles[index]?.cantidad ?? 1;

    // calcular precioBase (sin IGV) según incluirIGV
    const precioBase = (producto.tipoAfectacionIGV === "10" && producto.incluirIGV)
      ? parseFloat((precioConIGV / (1 + porcentajeIGV / 100)).toFixed(6))
      : precioConIGV;

    const precioVentaOriginal = producto.incluirIGV
      ? precioConIGV
      : parseFloat((precioConIGV * (1 + porcentajeIGV / 100)).toFixed(2));

    const calc = calcularDetalle(precioBase, cantidad, porcentajeIGV, producto.tipoAfectacionIGV, precioVentaOriginal, 0);

    const nuevos = [...detalles];
    nuevos[index] = {
      ...nuevos[index],
      productoId: producto.productoId, codigo: producto.codigo,
      descripcion: producto.nomProducto, unidadMedida: producto.unidadMedida,
      tipoAfectacionIGV: producto.tipoAfectacionIGV, porcentajeIGV,
      _incluirIGV: producto.incluirIGV, _precioBase: precioBase,
      ...calc,
    };
    setDetalles(nuevos);

    const nb = [...busquedaProducto]; nb[index] = producto.nomProducto; setBusquedaProducto(nb);
    const nd = [...showDropdownProducto]; nd[index] = false; setShowDropdownProducto(nd);
  };

  // ── Actualizar cantidad ──────────────────────────────────────
  const actualizarCantidad = (index: number, cantidad: number) => {
    const d = detalles[index];
    if (!d) return;
    const precioBase = d._precioBase ?? d.precioUnitario ?? 0;
    const precioVentaOriginal = d.precioVenta ?? 0;
    const descuentoUnitario = d.descuentoUnitario ?? 0;
    const calc = calcularDetalle(precioBase, cantidad, d.porcentajeIGV ?? 18, d.tipoAfectacionIGV ?? '10', precioVentaOriginal + descuentoUnitario, descuentoUnitario);
    const nuevos = [...detalles]; nuevos[index] = { ...d, cantidad, ...calc }; setDetalles(nuevos);
  };

  // ── Actualizar precio unitario (editable) ────────────────────
  const actualizarPrecioUnitario = (index: number, nuevoPrecioBase: number) => {
    const d = detalles[index];
    if (!d) return;
    const porcentajeIGV = d.porcentajeIGV ?? 18;
    const tipoAfectacion = d.tipoAfectacionIGV ?? '10';
    const precioVentaOriginal = tipoAfectacion === '10'
      ? parseFloat((nuevoPrecioBase * (1 + porcentajeIGV / 100)).toFixed(2))
      : nuevoPrecioBase;
    const calc = calcularDetalle(nuevoPrecioBase, d.cantidad ?? 1, porcentajeIGV, tipoAfectacion, precioVentaOriginal, 0);
    const nuevos = [...detalles];
    nuevos[index] = { ...d, _precioBase: nuevoPrecioBase, descuentoUnitario: 0, ...calc };
    setDetalles(nuevos);
  };

  // ── Actualizar descuento (reduce precioVenta) ────────────────
  const actualizarDescuento = (index: number, descuentoUnitario: number) => {
    const d = detalles[index];
    if (!d) return;
    const precioBase = d._precioBase ?? d.precioUnitario ?? 0;
    const porcentajeIGV = d.porcentajeIGV ?? 18;
    const tipoAfectacion = d.tipoAfectacionIGV ?? '10';
    const precioVentaOriginal = tipoAfectacion === '10'
      ? parseFloat((precioBase * (1 + porcentajeIGV / 100)).toFixed(2))
      : precioBase;
    const calc = calcularDetalle(precioBase, d.cantidad ?? 1, porcentajeIGV, tipoAfectacion, precioVentaOriginal, descuentoUnitario);
    const nuevos = [...detalles];
    nuevos[index] = { ...d, descuentoUnitario, ...calc };
    setDetalles(nuevos);
  };

  // ── Actualizar %IGV ──────────────────────────────────────────
  const actualizarPorcentajeIGV = (index: number, porcentaje: number) => {
    const d = detalles[index];
    if (!d) return;
    const precioBase = d._precioBase ?? d.precioUnitario ?? 0;
    const precioVentaOriginal = parseFloat((precioBase * (1 + porcentaje / 100)).toFixed(2));
    const calc = calcularDetalle(precioBase, d.cantidad ?? 1, porcentaje, d.tipoAfectacionIGV ?? '10', precioVentaOriginal, d.descuentoUnitario ?? 0);
    const nuevos = [...detalles];
    nuevos[index] = { ...d, porcentajeIGV: porcentaje, ...calc };
    setDetalles(nuevos);
  };

  // ── Eliminar fila ────────────────────────────────────────────
  const eliminarFila = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
    setBusquedaProducto(prev => prev.filter((_, i) => i !== index));
    setShowDropdownProducto(prev => prev.filter((_, i) => i !== index));
    inputRefs.current = inputRefs.current.filter((_, i) => i !== index);
  };

  // ── Preparar para envío ──────────────────────────────────────
  const prepararBoleta = () => ({
    ...boleta,
    tipoPago: boleta.tipoPago === 'CreditoInicial' ? 'Credito' : boleta.tipoPago,
    fechaEmision: fechaEmisionEditada ? boleta.fechaEmision : formatoFechaActual().fechaHora,
    horaEmision: fechaEmisionEditada ? boleta.horaEmision : formatoFechaActual().fechaHora,
  });

  const montoRestante = (index: number) => {
    const pagado = pagos.reduce((acc, p, i) => i < index ? acc + (Number(p.monto) || 0) : acc, 0)
    return Math.max(0, totales.total - descuentoGlobal - pagado).toFixed(2)
  }

  useEffect(() => { console.log('boleta:', boleta); }, [boleta]);

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

              {/* Cliente + Serie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tipo y Nº Documento</label>
                  <div className="flex gap-2">
                    <select value={tipoDoc} onChange={(e) => { setTipoDoc(e.target.value); setBusqueda(''); setShowDropdown(false); setBoleta(prev => ({ ...prev, cliente: undefined })); }}
                      className="w-1/3 py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm">
                      <option value="01">DNI</option>
                      <option value="06">RUC</option>
                      <option value="04">CE</option>
                    </select>
                    <div className="relative w-2/3">
                      <input type="text" value={busqueda}
                        onChange={(e) => {
                          setBusqueda(e.target.value); setShowDropdown(true);
                          if (e.target.value.length < busqueda.length || e.target.value === '')
                            setBoleta(prev => ({ ...prev, cliente: undefined }));
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                        maxLength={tipoDoc === '01' ? 8 : tipoDoc === '06' ? 11 : 12}
                        placeholder="Buscar por nº doc o nombre..."
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-sm"
                      />
                      {loadingCliente && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />}
                      {showDropdown && clientesFiltrados.length > 0 && (
                        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {loadingLista ? <p className="text-xs text-gray-400 px-4 py-3">Cargando...</p> : (
                            clientesFiltrados.map(c => (
                              <button key={c.clienteId} type="button" onMouseDown={() => seleccionarDeLista(c)}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                                <span className="text-sm text-gray-800">{c.numeroDocumento} - {c.razonSocialNombre}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <input type="text" disabled value={boleta.cliente?.razonSocial ?? ''} placeholder="Nombre o razón social"
                    className="w-full py-2.5 px-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 text-sm" />
                  {errorCliente && <p className="text-xs text-red-500">{errorCliente}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Serie y Número</label>
                  <div className="flex gap-2">
                    <select disabled className="w-1/3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none px-2 text-sm">
                      <option>{sucursal?.serieBoleta}</option>
                    </select>
                    <input type="text" disabled value={String(sucursal?.correlativoBoleta ?? '').padStart(8, '0')}
                      className="w-2/3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl px-4 text-gray-500 font-mono text-sm" />
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Fecha y Hora de Emisión</label>
                  <input type="datetime-local"
                    value={fechaEmisionEditada ? (boleta.fechaEmision?.slice(0, 16) ?? '') : horaDisplay.slice(0, 16)}
                    onChange={(e) => { setFechaEmisionEditada(true); setBoleta(prev => ({ ...prev, fechaEmision: e.target.value + ':00', horaEmision: e.target.value + ':00' })); }}
                    className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-sm" />
                  {fechaEmisionEditada && (
                    <button type="button" onClick={() => setFechaEmisionEditada(false)} className="text-[10px] text-brand-blue hover:underline">↺ Usar hora actual</button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Fecha de Vencimiento</label>
                  <input type="date" value={boleta.fechaVencimiento?.slice(0, 10) ?? ''}
                    onChange={(e) => setBoleta(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                    className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-sm" />
                </div>
              </div>

              {/* Moneda y Tipo Pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Moneda</label>
                  <select value={boleta.tipoMoneda ?? 'PEN'} onChange={(e) => setBoleta(prev => ({ ...prev, tipoMoneda: e.target.value }))}
                    className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm">
                    <option value="PEN">PEN - Soles</option>
                    <option value="USD">USD - Dólares</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tipo de Pago</label>
                  <select
                    value={boleta.tipoPago ?? 'Contado'}
                    onChange={(e) => {
                      setBoleta(prev => ({ ...prev, tipoPago: e.target.value }))
                      setPagos([{ medioPago: 'Efectivo', monto: '', numeroOperacion: '', entidadFinanciera: '', observaciones: '' }])
                      setPagosEditados([false])
                    }}
                    className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm">
                    <option value="Contado">Contado</option>
                    <option value="Credito">Crédito</option>
                    <option value="CreditoInicial">Crédito con Inicial</option>
                  </select>
                </div>
              </div>

              {/* Pagos — Contado o CreditoInicial */}
              {(boleta.tipoPago === 'Contado' || boleta.tipoPago === 'CreditoInicial') && (
                <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      {boleta.tipoPago === 'CreditoInicial' ? 'Pago Inicial' : 'Datos de Pago'}
                    </label>
                    {mediosUsados.length < todosMedios.length && (
                      <button type="button" onClick={agregarPago} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Agregar medio de pago
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {pagos.map((pago, i) => (
                      <div key={i} className="space-y-3 pb-3 border-b border-gray-100 last:border-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs text-gray-500">Medio de Pago</label>
                            <select value={pago.medioPago} onChange={(e) => actualizarPago(i, 'medioPago', e.target.value)}
                              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm">
                              {todosMedios.map(m => (
                                <option key={m} value={m} disabled={mediosUsados.includes(m) && pago.medioPago !== m}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-gray-500">Monto</label>
                            <div className="flex gap-2">
                              <input type="number" value={pago.monto}  
                              onChange={(e) => {
                                actualizarPago(i, 'monto', e.target.value)
                                setPagosEditados(prev => {
                                  const n = [...prev]
                                  n[i] = e.target.value !== ''
                                  return n
                                })
                              }}
                              onBlur={(e) => {
                                if (e.target.value === '' || e.target.value === '0') {
                                  setPagosEditados(prev => { const n = [...prev]; n[i] = false; return n })
                                  actualizarPago(i, 'monto', '')
                                }
                              }}
                                onFocus={(e) => {
                                  if (!pago.monto) {
                                    actualizarPago(i, 'monto', montoRestante(i))
                                  }
                                }}
                                placeholder={montoRestante(i)}
                                className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm" />
                              {pagos.length > 1 && (
                                <button type="button" onClick={() => eliminarPago(i)} className="text-red-400 hover:text-red-600 px-2">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          {pago.medioPago !== 'Efectivo' && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-xs text-gray-500">Nº Operación</label>
                                <input type="text" value={pago.numeroOperacion} onChange={(e) => actualizarPago(i, 'numeroOperacion', e.target.value)} placeholder="Número de operación"
                                  className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs text-gray-500">Entidad Financiera</label>
                                <input type="text" value={pago.entidadFinanciera} onChange={(e) => actualizarPago(i, 'entidadFinanciera', e.target.value)} placeholder="Banco / entidad"
                                  className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm" />
                              </div>
                            </>
                          )}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs text-gray-500">Observaciones</label>
                            <input type="text" value={pago.observaciones} onChange={(e) => actualizarPago(i, 'observaciones', e.target.value)} placeholder="Observaciones (opcional)"
                              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {boleta.tipoPago === 'CreditoInicial' && (
                    <div className="flex justify-between text-xs pt-2 border-t border-gray-100">
                      <p className="text-gray-500">Total pagado: <span className="font-semibold text-gray-800">S/ {totalPagado.toFixed(2)}</span></p>
                      <p className="text-gray-500">Monto a crédito: <span className="font-semibold text-brand-blue">S/ {Math.max(0, totales.total - totalPagado).toFixed(2)}</span></p>
                    </div>
                  )}
                </div>
              )}

              {/* Cuotas */}
              {(boleta.tipoPago === 'Credito' || boleta.tipoPago === 'CreditoInicial') && (
                <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase">Cuotas de Pago</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Nº cuotas:</span>
                      <input type="number" min={1} max={24} value={numeroCuotas} onChange={(e) => setNumeroCuotas(Number(e.target.value))}
                        className="w-16 py-1.5 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-blue text-center" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cuotas.map((cuota, i) => (
                      <div key={i} className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400">Cuota</label>
                          <input type="text" disabled value={cuota.numeroCuota} className="w-full py-2 px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400">Monto</label>
                          <input type="number" value={cuota.monto} onChange={(e) => { const n = [...cuotas]; n[i].monto = e.target.value; setCuotas(n); }} placeholder="0.00"
                              onBlur={(e) => {
                                if (e.target.value === '' || e.target.value === '0') {
                                  const n = [...cuotas]
                                  n[i].monto = ''  // vaciar → el useEffect recalcula
                                  setCuotas(n)
                                }
                              }}
                            className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-blue" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400">Fecha Vencimiento</label>
                          <input type="date" value={cuota.fechaVencimiento} onChange={(e) => { const n = [...cuotas]; n[i].fechaVencimiento = e.target.value; setCuotas(n); }}
                            className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-blue" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla Ítems */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase">Ítems / Productos</label>
                  <Button type="button" variant="ghost" className="h-8 text-xs text-brand-blue" onClick={agregarFila}>
                    <Plus className="w-3 h-3 mr-1" /> Agregar ítem
                  </Button>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-x-auto">
                  <table className="w-full text-xs" style={{ minWidth: '700px' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-gray-500 w-6">#</th>
                        <th className="px-2 py-2 text-left text-gray-500" style={{ minWidth: '150px' }}>Producto</th>
                        <th className="px-2 py-2 text-left text-gray-500 w-16">Cód.</th>
                        <th className="px-2 py-2 text-center text-gray-500 w-14">Cant.</th>
                        <th className="px-2 py-2 text-right text-gray-500 w-16">P.Venta</th>
                        <th className="px-2 py-2 text-center text-gray-500 w-16">%IGV</th>
                        <th className="px-2 py-2 text-right text-gray-500 w-16">Desc.Unit</th>
                        <th className="px-2 py-2 text-right text-gray-500 w-20">Total</th>
                        <th className="px-2 py-2 w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detalles.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-4 py-8 text-center text-xs text-gray-400">
                            Sin ítems. Haz clic en "Agregar ítem" para comenzar.
                          </td>
                        </tr>
                      ) : (
                        detalles.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>

                            {/* Buscador producto — dropdown con position fixed */}
                            <td className="px-2 py-1.5" style={{ overflow: 'visible', position: 'relative' }}>
                              <input
                                ref={el => { inputRefs.current[i] = el; }}
                                type="text" value={busquedaProducto[i] ?? ''}
                                onChange={(e) => {
                                  const nb = [...busquedaProducto]; nb[i] = e.target.value; setBusquedaProducto(nb);
                                  const nd = [...showDropdownProducto]; nd[i] = true; setShowDropdownProducto(nd);
                                }}
                                onFocus={() => { const nd = [...showDropdownProducto]; nd[i] = true; setShowDropdownProducto(nd); }}
                                onBlur={() => setTimeout(() => { const nd = [...showDropdownProducto]; nd[i] = false; setShowDropdownProducto(nd); }, 150)}
                                placeholder="Buscar producto..."
                                className="w-full py-1 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue"
                              />
                              {showDropdownProducto[i] && (() => {
                                const rect = inputRefs.current[i]?.getBoundingClientRect();
                                return (
                                  <div style={{
                                    position: 'fixed', zIndex: 9999,
                                    top: (rect?.bottom ?? 0) + window.scrollY + 4,
                                    left: rect?.left ?? 0, width: '260px',
                                  }} className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                                    {productosSucursal
                                      .filter((p: ProductoSucursal) =>
                                        (busquedaProducto[i] ?? '').length === 0 ? true :
                                          p.nomProducto.toLowerCase().includes((busquedaProducto[i] ?? '').toLowerCase()) ||
                                          p.codigo.includes(busquedaProducto[i] ?? ''))
                                      .map((p: ProductoSucursal) => (
                                        <button key={p.productoId} type="button" onMouseDown={() => seleccionarProducto(p, i)}
                                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                          <p className="text-xs font-medium text-gray-800">{p.nomProducto}</p>
                                          <p className="text-[10px] text-gray-400">{p.codigo} · S/ {p.sucursalProducto.precioUnitario.toFixed(2)}</p>
                                        </button>
                                      ))}
                                  </div>
                                );
                              })()}
                            </td>

                            <td className="px-2 py-1.5 text-gray-500 font-mono text-[10px]">{d.codigo || '-'}</td>

                            {/* Cantidad */}
                            <td className="px-2 py-1.5">
                              <input type="number" min={1} value={d.cantidad ?? 1}
                                onChange={(e) => actualizarCantidad(i, Number(e.target.value))}
                                className="w-full py-1 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-center outline-none focus:border-brand-blue" />
                            </td>

                            <td className="px-2 py-1.5 text-right font-mono text-gray-700">{(d.precioVenta ?? 0).toFixed(2)}</td>

                            {/* %IGV editable */}
                            <td className="px-2 py-1.5">
                              <input type="number" min={0} max={100} value={d.porcentajeIGV ?? 18}
                                onChange={(e) => actualizarPorcentajeIGV(i, Number(e.target.value))}
                                className="w-full py-1 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-center outline-none focus:border-brand-blue" />
                            </td>

                            {/* Precio unitario sin IGV — editable 
                            <td className="px-2 py-1.5">
                              <input type="number" min={0} step="0.01" value={d.precioUnitario ?? 0}
                                onChange={(e) => actualizarPrecioUnitario(i, Number(e.target.value))}
                                className="w-full py-1 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right outline-none focus:border-brand-blue font-mono" />
                            </td>*/}

                            {/* Descuento unitario */}
                            <td className="px-2 py-1.5">
                              <input type="number" min={0} step="0.01" value={d.descuentoUnitario ?? 0}
                                onChange={(e) => actualizarDescuento(i, Number(e.target.value))}
                                className="w-full py-1 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right outline-none focus:border-brand-blue font-mono" />
                            </td>
                             <td className="px-2 py-1.5 text-right font-mono font-semibold text-gray-800">{(d.totalVentaItem ?? 0).toFixed(2)}</td>

                            <td className="px-2 py-1.5">
                              <button type="button" onClick={() => eliminarFila(i)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Guías de Remisión */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setShowGuias(!showGuias)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-xs font-bold text-gray-500 uppercase">Guías de Remisión (opcional)</span>
                  {showGuias ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showGuias && (
                  <div className="p-4 space-y-3">
                    {guias.map((g, i) => (
                      <div key={i} className="grid grid-cols-3 gap-3 items-end">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400">Tipo Doc</label>
                          <select value={g.tipoDoc} onChange={(e) => actualizarGuia(i, 'tipoDoc', e.target.value)}
                            className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue">
                            <option value="09">Guía Remisión Remitente</option>
                            <option value="31">Guía Remisión Transportista</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400">Serie</label>
                          <input type="text" value={g.serie} onChange={(e) => actualizarGuia(i, 'serie', e.target.value)} placeholder="T001"
                            className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400">Número</label>
                          <div className="flex gap-2">
                            <input type="text" value={g.numero} onChange={(e) => actualizarGuia(i, 'numero', e.target.value)} placeholder="00000001"
                              className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue" />
                            <button type="button" onClick={() => eliminarGuia(i)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={agregarGuia}
                      className="text-xs text-brand-blue hover:underline flex items-center gap-1 pt-1">
                      <Plus className="w-3 h-3" /> Agregar guía
                    </button>
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => router.push('/emision')}>Cancelar</Button>
                <div className="space-y-1.5 text-right">
                  {totales.gravadas > 0 && (
                    <div className="flex justify-end gap-8 text-sm text-gray-500">
                      <span>Op. Gravadas:</span>
                      <span className="font-medium text-gray-900 w-24">S/ {totales.gravadas.toFixed(2)}</span>
                    </div>
                  )}
                  {totales.exoneradas > 0 && (
                    <div className="flex justify-end gap-8 text-sm text-gray-500">
                      <span>Op. Exoneradas:</span>
                      <span className="font-medium text-gray-900 w-24">S/ {totales.exoneradas.toFixed(2)}</span>
                    </div>
                  )}
                  {totales.inafectas > 0 && (
                    <div className="flex justify-end gap-8 text-sm text-gray-500">
                      <span>Op. Inafectas:</span>
                      <span className="font-medium text-gray-900 w-24">S/ {totales.inafectas.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-8 text-sm text-gray-500">
                    <span>IGV:</span>
                    <span className="font-medium text-gray-900 w-24">S/ {totales.igv.toFixed(2)}</span>
                  </div>
                  {totales.totalDescuentos > 0 && (
                    <div className="flex justify-end gap-8 text-sm text-gray-500">
                      <span>Descuentos:</span>
                      <span className="font-medium text-red-500 w-24">-S/ {totales.totalDescuentos.toFixed(2)}</span>
                    </div>
                  )}
                  {/* Descuento global */}
                  <div className="flex justify-end gap-4 items-center">
                    <span className="text-sm text-gray-500">Desc. Global:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-400">S/</span>
                      <input type="number" min={0} step="0.01" value={descuentoGlobal}
                        onChange={(e) => setDescuentoGlobal(Number(e.target.value))}
                        className="w-24 py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-brand-blue font-mono" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-8 text-lg font-bold text-brand-blue pt-1 border-t border-gray-100">
                    <span>Total:</span>
                    <span className="w-24">S/ {totales.total.toFixed(2)}</span>
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
              <Button
                className="w-full py-3 text-base"
                type="button"
                onClick={emitirComprobante}
                disabled={emitiendo}
              >
                {emitiendo ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Emitiendo...
                  </span>
                ) : 'Emitir Comprobante'}
              </Button>

              {errorEmision && (
                <p className="text-xs text-red-500 text-center mt-1">{errorEmision}</p>
              )}
              <Button variant="outline" className="w-full" type="button">Guardar como Borrador</Button>
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