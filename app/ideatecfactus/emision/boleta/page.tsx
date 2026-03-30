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

interface DetalleLocal extends Partial<BoletaDetalle> {
  _incluirIGV?: boolean
  _precioBase?: number
  _precioVentaConIGV?: number // precio con IGV que se muestra y edita
}

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
  const RUC = "20601737583";
  const SUCURSAL_ID = 1;
  const IGV_DEFAULT = 10.5 

  const { empresa } = useEmpresaEmisor(RUC ?? '');
  const { cliente, loadingCliente, errorCliente, buscarCliente } = useClienteBoleta();
  const { clientes, loadingLista } = useClientesLista(RUC ?? "");
  const { sucursal } = useSucursal(SUCURSAL_ID);
  const [correlativoActual, setCorrelativoActual] = useState<number | null>(null);
  const { productosSucursal } = useProductosSucursal(SUCURSAL_ID);

  const { fecha, fechaHora } = formatoFechaActual();

  const [tipoDoc, setTipoDoc] = useState('01');
  const [busqueda, setBusqueda] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [horaDisplay, setHoraDisplay] = useState(fechaHora);
  const [fechaEmisionEditada, setFechaEmisionEditada] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [emitiendo, setEmitiendo] = useState(false)
  const [errorEmision, setErrorEmision] = useState<string | null>(null)

  const emitirComprobante = async () => {
  // ✅ validaciones antes de emitir
  if (!detalles.length) {
    showToast('Debe agregar al menos un ítem', 'error')
    return
  }
  setEmitiendo(true)
  setErrorEmision(null)
  try {
    const boletaFinal = prepararBoleta()
    const resBoleta = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/GenerarXml`, boletaFinal)
    const comprobanteId = resBoleta.data.comprobanteId;
    const resSunat = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobanteId}/enviar-sunat`)
    const respuesta = resSunat.data

    // ✅ toast según respuesta SUNAT
    if (respuesta.exitoso) {
      showToast(respuesta.mensaje ?? 'Boleta emitida correctamente.', 'success')
    } else {
      console.log("Mensaje de error: ", respuesta.mensaje)
        showToast(`Boleta ${boletaFinal.serie}-${boletaFinal.correlativo} generada pero rechazada por SUNAT`, 'error')
    }

    // ✅ actualizar serie y limpiar siempre, sin importar respuesta SUNAT
    const resSucursal = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${SUCURSAL_ID}`)
    setCorrelativoActual(resSucursal.data.correlativoBoleta)

    setBoleta({
      ublVersion: "2.1",
      tipoOperacion: "0101",
      tipoComprobante: "03",
      tipoMoneda: "PEN",
      fechaEmision: formatoFechaActual().fechaHora,
      horaEmision: formatoFechaActual().fechaHora,
      fechaVencimiento: formatoFechaActual().fecha,
      tipoPago: "Contado",
      serie: resSucursal.data.serieBoleta,
      correlativo: String(resSucursal.data.correlativoBoleta).padStart(8, '0'),
      company: boleta.company,
    })

    setDetalles([])
    setBusquedaProducto([])
    setShowDropdownProducto([])
    inputRefs.current = []
    setPagos([{ medioPago: 'Efectivo', monto: '', numeroOperacion: '', entidadFinanciera: '', observaciones: '' }])
    setPagosEditados([false])
    setBusqueda('')
    setDescuentoGlobal(0)
    setCodigoTipoDescGlobal('03')
    setNumeroCuotas(1)
    setCuotas([])
    setGuias([])
    setFechaEmisionEditada(false)

  } catch (err: any) {
    const data = err?.response?.data
    const mensaje = data?.mensaje ?? data?.message ?? 'Error al emitir el comprobante'
    const detalle = data?.detalle
    const mensajeCompleto = detalle ? `${mensaje}: ${detalle}` : mensaje
    setErrorEmision(mensajeCompleto)
    console.log("Error de api: ", mensajeCompleto)
    showToast("Error al emitir comprobante.", 'error')
  } finally {
    setEmitiendo(false)
  }
  }

  useEffect(() => {
    if (fechaEmisionEditada) { if (intervaloRef.current) clearInterval(intervaloRef.current); return; }
    intervaloRef.current = setInterval(() => { setHoraDisplay(formatoFechaActual().fechaHora); }, 1000);
    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current); };
  }, [fechaEmisionEditada]);

  const [pagos, setPagos] = useState<PagoLocal[]>([
    { medioPago: 'Efectivo', monto: '', numeroOperacion: '', entidadFinanciera: '', observaciones: '' }
  ]);
  const [pagosEditados, setPagosEditados] = useState<boolean[]>([false])
  const pagosEditadosRef = useRef<boolean[]>([false])
  useEffect(() => { pagosEditadosRef.current = pagosEditados }, [pagosEditados])

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

  const [numeroCuotas, setNumeroCuotas] = useState(1);
  const [cuotas, setCuotas] = useState<{ numeroCuota: string; monto: string; fechaVencimiento: string }[]>([]);

  // fecha base: día 15 del mes siguiente a hoy
  useEffect(() => {
    const hoy = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fechaBase = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 2)}-15`
      .replace(/(\d{4})-13-/, (_, y) => `${Number(y) + 1}-01-`) // si es diciembre
    
    const fechas = calcularFechasCuotas(fechaBase, numeroCuotas)
    
    setCuotas(Array.from({ length: numeroCuotas }, (_, i) => ({
      numeroCuota: `Cuota${String(i + 1).padStart(3, '0')}`,
      monto: '',
      fechaVencimiento: fechas[i],
    })));
  }, [numeroCuotas]);

  const [detalles, setDetalles] = useState<DetalleLocal[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState<string[]>([]);
  const [showDropdownProducto, setShowDropdownProducto] = useState<boolean[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Descuento global ─────────────────────────────────────────
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [codigoTipoDescGlobal, setCodigoTipoDescGlobal] = useState('03');
  
  //cambios a dolares
  const [tipoCambio, setTipoCambio] = useState(3.75)

  const [showGuias, setShowGuias] = useState(false);
  const [guias, setGuias] = useState<{ serie: string; numero: string; tipoDoc: string }[]>([]);
  const agregarGuia = () => setGuias(prev => [...prev, { serie: '', numero: '', tipoDoc: '09' }]);
  const eliminarGuia = (i: number) => setGuias(prev => prev.filter((_, idx) => idx !== i));
  const actualizarGuia = (i: number, campo: string, valor: string) => {
    setGuias(prev => { const n = [...prev]; n[i] = { ...n[i], [campo]: valor }; return n; });
  };

  const [boleta, setBoleta] = useState<Partial<Boleta>>({
    ublVersion: "2.1", tipoOperacion: "0101", tipoComprobante: "03",
    tipoMoneda: "PEN", fechaEmision: fechaHora, horaEmision: fechaHora,
    fechaVencimiento: fecha, tipoPago: "Contado",
  });

  useEffect(() => { if (!empresa) return; setBoleta(prev => ({ ...prev, company: empresa })); }, [empresa]);
  useEffect(() => { if (!cliente) return; setBoleta(prev => ({ ...prev, cliente: cliente as BoletaCliente })); }, [cliente]);
  useEffect(() => {
    if (!sucursal) return;
    setBoleta(prev => ({ ...prev, serie: sucursal.serieBoleta, correlativo: String(sucursal.correlativoBoleta).padStart(8, '0') }));
  }, [sucursal]);

  useEffect(() => {
    if (!sucursal) return
    setCorrelativoActual(sucursal.correlativoBoleta) //Actualiza serie y correlativo
  }, [sucursal])

  useEffect(() => {
    if (boleta.tipoPago !== 'Contado' && boleta.tipoPago !== 'CreditoInicial') return;
    const pagosFormateados: BoletaPago[] = pagos.map(p => ({
      medioPago: p.medioPago, monto: Number(p.monto) || 0, fechaPago: fechaHora,
      numeroOperacion: p.medioPago === 'Efectivo' ? '' : p.numeroOperacion,
      entidadFinanciera: p.medioPago === 'Efectivo' ? '' : p.entidadFinanciera,
      observaciones: p.observaciones,
    }));
    setBoleta(prev => ({ ...prev, pagos: pagosFormateados, cuotas: [] }));
  }, [pagos, boleta.tipoPago]);

  useEffect(() => {
    if (boleta.tipoPago !== 'Credito' && boleta.tipoPago !== 'CreditoInicial') return;
    const cuotasFormateadas: BoletaCuota[] = cuotas.map(c => ({
      numeroCuota: c.numeroCuota, monto: Number(c.monto) || 0,
      fechaVencimiento: c.fechaVencimiento,
    }));
    if (boleta.tipoPago === 'Credito') {
      setBoleta(prev => ({ ...prev, cuotas: cuotasFormateadas, pagos: [] }));
    } else {
      setBoleta(prev => ({ ...prev, cuotas: cuotasFormateadas }));
    }
  }, [cuotas, boleta.tipoPago]);

  useEffect(() => {
    const detallesLimpios = detalles.map(({ _incluirIGV, _precioBase, _precioVentaConIGV, ...d }) => d) as BoletaDetalle[];
    setBoleta(prev => ({ ...prev, details: detallesLimpios }));
  }, [detalles]);

  useEffect(() => {
    const guiasFormateadas: BoletaGuia[] = guias.filter(g => g.serie && g.numero)
      .map(g => ({ guiaNumeroCompleto: `${g.serie}-${g.numero}`, guiaTipoDoc: g.tipoDoc }));
    setBoleta(prev => ({ ...prev, guias: guiasFormateadas }));
  }, [guias]);

  // ── Totales con lógica de descuentos ─────────────────────────
  const totales = useMemo(() => {
    // Suma base de gravadas SIN considerar descuento tipo 00 aún
    const gravadas_bruto = detalles.filter(d => d.tipoAfectacionIGV === '10')
      .reduce((acc, d) => acc + (d.baseIgv ?? 0), 0)
    const exoneradas = detalles.filter(d => d.tipoAfectacionIGV === '20')
      .reduce((acc, d) => acc + (d.baseIgv ?? 0), 0)
    const inafectas = detalles.filter(d => d.tipoAfectacionIGV === '30')
      .reduce((acc, d) => acc + (d.baseIgv ?? 0), 0)
    const igv_bruto = detalles.filter(d => d.tipoAfectacionIGV === '10')
      .reduce((acc, d) => acc + (d.montoIGV ?? 0), 0)

    // totalDescuentos = suma de descuentoTotal de todos los ítems
    const totalDescuentosItems = detalles.reduce((acc, d) => acc + (d.descuentoTotal ?? 0), 0)

    // Descuento global tipo 02 → afecta gravadas e IGV
    let gravadas = gravadas_bruto
    let igv = igv_bruto
    let descGlobalEnTotales = 0

    if (codigoTipoDescGlobal === '02' && descuentoGlobal > 0) {
      gravadas = parseFloat(Math.max(0, gravadas_bruto - descuentoGlobal).toFixed(2))
      igv = parseFloat((gravadas * (detalles.find(d => d.tipoAfectacionIGV === '10')?.porcentajeIGV ?? 18) / 100).toFixed(2))
      // tipo 02 el descuento global NO suma a totalDescuentos ni se resta del importe aparte
    }

    // Descuento global tipo 03 → NO afecta gravadas ni IGV, se resta del importeTotal
    if (codigoTipoDescGlobal === '03' && descuentoGlobal > 0) {
      descGlobalEnTotales = descuentoGlobal
    }

// descuentos tipo 01 no afectan base pero sí el total a pagar
    const descuentosTipo01 = detalles
      .filter(d => d.codigoTipoDescuento === '01')
      .reduce((acc, d) => acc + (d.descuentoTotal ?? 0), 0)

    const valorVenta = parseFloat((gravadas + exoneradas + inafectas).toFixed(2))
    const subTotal = parseFloat((valorVenta + igv - descuentosTipo01).toFixed(2))
    const totalDescuentos = parseFloat((totalDescuentosItems + descGlobalEnTotales).toFixed(2))
    const importeTotal = parseFloat(Math.max(0, subTotal - descGlobalEnTotales).toFixed(2))

    return {
      gravadas: parseFloat(gravadas.toFixed(2)),
      exoneradas: parseFloat(exoneradas.toFixed(2)),
      inafectas: parseFloat(inafectas.toFixed(2)),
      igv: parseFloat(igv.toFixed(2)),
      totalDescuentos,
      valorVenta,
      subTotal,
      importeTotal,
      total: importeTotal,
    }
  }, [detalles, descuentoGlobal, codigoTipoDescGlobal]);

  // Auto-calcular monto pagos
  useEffect(() => {
    if (totales.total === 0) return
    if (boleta.tipoPago !== 'Contado' && boleta.tipoPago !== 'CreditoInicial') return
    setPagos(prev => prev.map((pago, i) => {
      if (pagosEditadosRef.current[i]) return pago
      const pagadoAntes = prev.slice(0, i).reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
      const restante = Math.max(0, totales.total - pagadoAntes).toFixed(2)
      return { ...pago, monto: restante }
    }))
  }, [totales.total, boleta.tipoPago])

  // Auto-calcular cuotas
  useEffect(() => {
    if (boleta.tipoPago !== 'Credito' && boleta.tipoPago !== 'CreditoInicial') return
    if (totales.total === 0) return

    const baseCalculo = boleta.tipoPago === 'CreditoInicial'
      ? Math.max(0, totales.total - totalPagado)
      : totales.total

    const montoPorCuota = parseFloat((baseCalculo / numeroCuotas).toFixed(2))
    setCuotas(prev => prev.map(cuota => ({
      ...cuota,
      monto: String(montoPorCuota) // ✅ siempre recalcula
    })))
  }, [totales.total, numeroCuotas, boleta.tipoPago, totalPagado])

  // Sincronizar totales en boleta
  useEffect(() => {
    const moneda = boleta.tipoMoneda === 'USD' ? 'DÓLARES' : 'SOLES'
    const legend = [{ code: '1000', value: numeroALetras(totales.importeTotal, moneda) }]
    const montoCredito = boleta.tipoPago === 'CreditoInicial'
      ? parseFloat(Math.max(0, totales.total - totalPagado).toFixed(2)) : 0;
    setBoleta(prev => ({
      ...prev,
      tipoCambio: boleta.tipoMoneda === 'USD' ? tipoCambio : undefined,
      totalOperacionesGravadas: totales.gravadas,
      totalOperacionesExoneradas: totales.exoneradas,
      totalOperacionesInafectas: totales.inafectas,
      totalIGV: totales.igv,
      totalImpuestos: totales.igv,
      totalDescuentos: totales.totalDescuentos,
      codigoTipoDescGlobal,
      descuentoGlobal,
      subTotal: totales.subTotal,
      importeTotal: totales.importeTotal,
      valorVenta: totales.valorVenta,
      montoCredito,
      legends: legend,
    }));
  }, [totales, descuentoGlobal, codigoTipoDescGlobal, boleta.tipoPago, totalPagado]);

  const clientesFiltrados = clientes.filter(c => {
    if (c.tipoDocumento.tipoDocumentoId !== tipoDoc) return false;
    if (busqueda.length === 0) return true;
    return c.numeroDocumento.includes(busqueda) || c.razonSocialNombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const seleccionarDeLista = (c: Cliente) => {
    setBusqueda(c.numeroDocumento); setShowDropdown(false);
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
    precioBase: number,        // precio SIN IGV
    precioVentaConIGV: number, // precio CON IGV que muestra el vendedor
    cantidad: number,
    porcentajeIGV: number,
    tipoAfectacion: string,
    codigoDescuento: string,
    descuentoUnitario: number
  ) => {
    const precioUnitario = parseFloat(precioBase.toFixed(6))
    let baseIgv = 0, montoIGV = 0, totalVentaItem = 0, valorVenta = 0
    let precioVenta = parseFloat(precioVentaConIGV.toFixed(2))
    let descuentoTotal = 0

    if (tipoAfectacion === '10') {
      // gravado
      if (codigoDescuento === '00') {
        // descuento afecta base: baseIgv = (precioBase - descuentoUnitario_base) * cantidad
        // descuentoUnitario está en precio con IGV, convertir a base
        const descBase = parseFloat((descuentoUnitario / (1 + porcentajeIGV / 100)).toFixed(6))
        baseIgv = parseFloat(((precioBase - descBase) * cantidad).toFixed(2))
        montoIGV = parseFloat((baseIgv * porcentajeIGV / 100).toFixed(2))
        precioVenta = parseFloat((precioVentaConIGV - descuentoUnitario).toFixed(2))
        totalVentaItem = parseFloat((precioVenta * cantidad).toFixed(2))
        valorVenta = baseIgv
        descuentoTotal = parseFloat((descuentoUnitario * cantidad).toFixed(2))
      } else {
        // tipo 01: NO afecta base
        baseIgv = parseFloat((precioBase * cantidad).toFixed(2))
        montoIGV = parseFloat((baseIgv * porcentajeIGV / 100).toFixed(2))
        precioVenta = parseFloat((precioVentaConIGV - descuentoUnitario).toFixed(2))
        totalVentaItem = parseFloat(((precioVentaConIGV - descuentoUnitario) * cantidad).toFixed(2))
        valorVenta = baseIgv
        descuentoTotal = parseFloat((descuentoUnitario * cantidad).toFixed(2))
      }
    } else {
      // exonerado / inafecto (20, 30)
      if (codigoDescuento === '00') {
        // afecta base
        baseIgv = parseFloat(((precioBase - descuentoUnitario) * cantidad).toFixed(2))
        precioVenta = parseFloat((precioVentaConIGV - descuentoUnitario).toFixed(2))
        totalVentaItem = parseFloat((baseIgv).toFixed(2))
        descuentoTotal = parseFloat((descuentoUnitario * cantidad).toFixed(2))
      } else {
        // tipo 01: no afecta base
        baseIgv = parseFloat((precioBase * cantidad).toFixed(2))
        precioVenta = parseFloat(precioVentaConIGV.toFixed(2))
        totalVentaItem = parseFloat(((precioVentaConIGV - descuentoUnitario) * cantidad).toFixed(2))
        descuentoTotal = parseFloat((descuentoUnitario * cantidad).toFixed(2))
      }
      montoIGV = 0
      valorVenta = baseIgv
    }

    return { precioUnitario, precioVenta, baseIgv, montoIGV, totalVentaItem, valorVenta, descuentoTotal }
  }, []);

  //calcular fechas automaticas para cuotas
  const calcularFechasCuotas = (fechaBase: string, numCuotas: number): string[] => {
    const fechas: string[] = []
    const [anio, mes, dia] = fechaBase.split('-').map(Number)
    
    for (let i = 0; i < numCuotas; i++) {
      let nuevoDia = dia
      let nuevoMes = mes + i
      let nuevoAnio = anio

      while (nuevoMes > 12) {
        nuevoMes -= 12
        nuevoAnio++
      }

      // último día del mes destino
      const ultimoDia = new Date(nuevoAnio, nuevoMes, 0).getDate()
      if (nuevoDia > ultimoDia) nuevoDia = ultimoDia

      const pad = (n: number) => String(n).padStart(2, '0')
      fechas.push(`${nuevoAnio}-${pad(nuevoMes)}-${pad(nuevoDia)}`)
    }
    return fechas
  }

  const agregarFila = () => {
    setDetalles(prev => [...prev, {
      item: prev.length + 1, productoId: null, codigo: null, descripcion: '', cantidad: 1, unidadMedida: 'NIU',
      precioUnitario: 0, tipoAfectacionIGV: '10', porcentajeIGV: IGV_DEFAULT,
      montoIGV: 0, baseIgv: 0, codigoTipoDescuento: '01', descuentoUnitario: 0,
      descuentoTotal: 0, valorVenta: 0, precioVenta: 0, totalVentaItem: 0,
      icbper: 0, factorIcbper: 0, _incluirIGV: false, _precioBase: 0, _precioVentaConIGV: 0,
    }]);
    setBusquedaProducto(prev => [...prev, '']);
    setShowDropdownProducto(prev => [...prev, false]);
    inputRefs.current = [...inputRefs.current, null];
  };

  const seleccionarProducto = (producto: ProductoSucursal, index: number) => {
    const precioSistema = producto.sucursalProducto.precioUnitario;
    const precioEnMoneda = boleta.tipoMoneda === 'USD'
      ? parseFloat((precioSistema / tipoCambio).toFixed(6))
      : precioSistema

    // ✅ respetar el % que ya tiene la fila, si no usar IGV_DEFAULT
    const porcentajeExistente = detalles[index]?.porcentajeIGV
    const porcentajeIGV = producto.tipoAfectacionIGV === '10'
      ? (porcentajeExistente !== undefined ? porcentajeExistente : IGV_DEFAULT)
      : 0;

    const cantidad = detalles[index]?.cantidad ?? 1;

    const precioBase = (producto.tipoAfectacionIGV === "10" && producto.incluirIGV)
      ? parseFloat((precioEnMoneda / (1 + porcentajeIGV / 100)).toFixed(6))
      : precioEnMoneda;

    const precioVentaConIGV = producto.tipoAfectacionIGV === '10'
      ? (producto.incluirIGV ? precioEnMoneda : parseFloat((precioEnMoneda * (1 + porcentajeIGV / 100)).toFixed(2)))
      : precioEnMoneda;

    const calc = calcularDetalle(precioBase, precioVentaConIGV, cantidad, porcentajeIGV, producto.tipoAfectacionIGV, '01', 0);

    const nuevos = [...detalles];
    nuevos[index] = {
      ...nuevos[index],
      productoId: producto.productoId, codigo: producto.codigo,
      descripcion: producto.nomProducto, unidadMedida: producto.unidadMedida,
      tipoAfectacionIGV: producto.tipoAfectacionIGV,
      porcentajeIGV, // ✅ usa el porcentaje respetado
      codigoTipoDescuento: '01',
      _incluirIGV: producto.incluirIGV, _precioBase: precioBase,
      _precioVentaConIGV: precioVentaConIGV,
      ...calc,
    };
    setDetalles(nuevos);

    const nb = [...busquedaProducto]; nb[index] = producto.nomProducto; setBusquedaProducto(nb);
    const nd = [...showDropdownProducto]; nd[index] = false; setShowDropdownProducto(nd);
  };

  // Vendedor edita precioVenta con IGV → recalcula base (descuento oculto sin informar a SUNAT)
  const actualizarPrecioVenta = (index: number, nuevoPrecioVenta: number) => {
    const d = detalles[index];
    if (!d) return;
    const tipoAfectacion = d.tipoAfectacionIGV ?? '10';
    const porcentajeIGV = d.porcentajeIGV ?? 18;
    const codigoDescuento = d.codigoTipoDescuento ?? '01';

    // nueva base a partir del nuevo precioVenta
    const nuevoPrecioBase = tipoAfectacion === '10'
      ? parseFloat((nuevoPrecioVenta / (1 + porcentajeIGV / 100)).toFixed(6))
      : nuevoPrecioVenta;

    const calc = calcularDetalle(nuevoPrecioBase, nuevoPrecioVenta, d.cantidad ?? 1, porcentajeIGV, tipoAfectacion, codigoDescuento, d.descuentoUnitario ?? 0);
    const nuevos = [...detalles];
    nuevos[index] = { ...d, _precioBase: nuevoPrecioBase, _precioVentaConIGV: nuevoPrecioVenta, ...calc };
    setDetalles(nuevos);
  };

  const actualizarCantidad = (index: number, cantidad: number) => {
    const d = detalles[index];
    if (!d) return;
    const precioBase = d._precioBase ?? d.precioUnitario ?? 0;
    const precioVentaConIGV = d._precioVentaConIGV ?? d.precioVenta ?? 0;
    const calc = calcularDetalle(precioBase, precioVentaConIGV, cantidad, d.porcentajeIGV ?? 18, d.tipoAfectacionIGV ?? '10', d.codigoTipoDescuento ?? '01', d.descuentoUnitario ?? 0);
    const nuevos = [...detalles]; nuevos[index] = { ...d, cantidad, ...calc }; setDetalles(nuevos);
  };

  const actualizarDescuento = (index: number, descuentoUnitario: number) => {
    const d = detalles[index];
    if (!d) return;
    const precioBase = d._precioBase ?? d.precioUnitario ?? 0;
    const precioVentaConIGV = d._precioVentaConIGV ?? d.precioVenta ?? 0;
    const calc = calcularDetalle(precioBase, precioVentaConIGV, d.cantidad ?? 1, d.porcentajeIGV ?? 18, d.tipoAfectacionIGV ?? '10', d.codigoTipoDescuento ?? '01', descuentoUnitario);
    const nuevos = [...detalles]; nuevos[index] = { ...d, descuentoUnitario, ...calc }; setDetalles(nuevos);
  };

  const actualizarPorcentajeIGV = (index: number, porcentaje: number) => {
    const d = detalles[index];
    if (!d) return;
    const tipoAfectacion = d.tipoAfectacionIGV ?? '10'
    
    // ✅ recalcula base desde precioVentaConIGV con el nuevo porcentaje
    const precioVentaConIGV = d._precioVentaConIGV ?? d.precioVenta ?? 0
    const nuevaPrecioBase = tipoAfectacion === '10'
      ? parseFloat((precioVentaConIGV / (1 + porcentaje / 100)).toFixed(6))
      : precioVentaConIGV

    const calc = calcularDetalle(
      nuevaPrecioBase,
      precioVentaConIGV,
      d.cantidad ?? 1,
      porcentaje,
      tipoAfectacion,
      d.codigoTipoDescuento ?? '01',
      d.descuentoUnitario ?? 0
    )
    const nuevos = [...detalles]
    nuevos[index] = { ...d, porcentajeIGV: porcentaje, _precioBase: nuevaPrecioBase, ...calc }
    setDetalles(nuevos)
  }

  const actualizarCodigoDescuento = (index: number, codigo: string) => {
    const d = detalles[index];
    if (!d) return;
    const precioBase = d._precioBase ?? d.precioUnitario ?? 0;
    const precioVentaConIGV = d._precioVentaConIGV ?? d.precioVenta ?? 0;
    const calc = calcularDetalle(precioBase, precioVentaConIGV, d.cantidad ?? 1, d.porcentajeIGV ?? 18, d.tipoAfectacionIGV ?? '10', codigo, d.descuentoUnitario ?? 0);
    const nuevos = [...detalles]; nuevos[index] = { ...d, codigoTipoDescuento: codigo, ...calc }; setDetalles(nuevos);
  };

  const eliminarFila = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
    setBusquedaProducto(prev => prev.filter((_, i) => i !== index));
    setShowDropdownProducto(prev => prev.filter((_, i) => i !== index));
    inputRefs.current = inputRefs.current.filter((_, i) => i !== index);
  };

  const prepararBoleta = () => ({
    ...boleta,
    tipoPago: boleta.tipoPago === 'CreditoInicial' ? 'Credito' : boleta.tipoPago,
    fechaEmision: fechaEmisionEditada ? boleta.fechaEmision : formatoFechaActual().fechaHora,
    horaEmision: fechaEmisionEditada ? boleta.horaEmision : formatoFechaActual().fechaHora,
  });

  const montoRestante = (index: number) => {
    const pagado = pagos.reduce((acc, p, i) => i < index ? acc + (Number(p.monto) || 0) : acc, 0)
    return Math.max(0, totales.total - pagado).toFixed(2)
  }

  const simbolo = boleta.tipoMoneda === 'USD' ? '$' : 'S/'  //simbolo dolares y soles

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
                    <input type="text" disabled value={String(correlativoActual ?? sucursal?.correlativoBoleta ?? '').padStart(8, '0')}
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
                  <select value={boleta.tipoMoneda ?? 'PEN'} 
                    onChange={(e) => {
                      const nuevaMoneda = e.target.value
                      const monedaAnterior = boleta.tipoMoneda ?? 'PEN'
                      setBoleta(prev => ({ ...prev, tipoMoneda: nuevaMoneda }))

                      // reconvertir precios de ítems existentes
                      if (detalles.length > 0) {
                        setDetalles(prev => prev.map(d => {
                          const precioBase = d._precioBase ?? 0
                          const nuevoPrecioBase = nuevaMoneda === 'USD' && monedaAnterior === 'PEN'
                            ? parseFloat((precioBase / tipoCambio).toFixed(6))
                            : nuevaMoneda === 'PEN' && monedaAnterior === 'USD'
                            ? parseFloat((precioBase * tipoCambio).toFixed(6))
                            : precioBase

                          const porcentajeIGV = d.porcentajeIGV ?? 18
                          const tipoAfectacion = d.tipoAfectacionIGV ?? '10'
                          const nuevoPrecioVenta = tipoAfectacion === '10'
                            ? parseFloat((nuevoPrecioBase * (1 + porcentajeIGV / 100)).toFixed(2))
                            : nuevoPrecioBase

                          const calc = calcularDetalle(nuevoPrecioBase, nuevoPrecioVenta, d.cantidad ?? 1, porcentajeIGV, tipoAfectacion, d.codigoTipoDescuento ?? '01', d.descuentoUnitario ?? 0)
                          return { ...d, _precioBase: nuevoPrecioBase, _precioVentaConIGV: nuevoPrecioVenta, ...calc }
                        }))
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm">
                    <option value="PEN">PEN - Soles</option>
                    <option value="USD">USD - Dólares ({tipoCambio.toFixed(2)})</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tipo de Pago</label>
                  <select value={boleta.tipoPago ?? 'Contado'}
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

              {/* Pagos */}
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
                                  setPagosEditados(prev => { const n = [...prev]; n[i] = e.target.value !== ''; return n; })
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === '' || e.target.value === '0') {
                                    setPagosEditados(prev => { const n = [...prev]; n[i] = false; return n })
                                    actualizarPago(i, 'monto', '')
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
                      <p className="text-gray-500">Total pagado: <span className="font-semibold text-gray-800">{simbolo} {totalPagado.toFixed(2)}</span></p>
                      <p className="text-gray-500">Monto a crédito: <span className="font-semibold text-brand-blue">{simbolo} {Math.max(0, totales.total - totalPagado).toFixed(2)}</span></p>
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
                          <input type="number" value={cuota.monto}
                            onChange={(e) => { const n = [...cuotas]; n[i].monto = e.target.value; setCuotas(n); }}
                            onBlur={(e) => { if (e.target.value === '' || e.target.value === '0') { const n = [...cuotas]; n[i].monto = ''; setCuotas(n); } }}
                            placeholder="0.00"
                            className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-blue" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400">Fecha Vencimiento</label>
                          <input type="date" value={cuota.fechaVencimiento} onChange={(e) => {
                            const nuevaFecha = e.target.value
                            const fechasSiguientes = calcularFechasCuotas(nuevaFecha, cuotas.length - i)
                            setCuotas(prev => prev.map((cuota, idx) => {
                              if (idx < i) return cuota // cuotas anteriores no tocar
                              return { ...cuota, fechaVencimiento: fechasSiguientes[idx - i] }
                            }))
                          }}
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
                  <table className="w-full text-xs" style={{ minWidth: '780px' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-gray-500 w-6">#</th>
                        <th className="px-2 py-2 text-left text-gray-500" style={{ minWidth: '100px' }}>Producto</th>
                        <th className="px-2 py-2 text-left text-gray-500 w-14">Cód.</th>
                        <th className="px-2 py-2 text-center text-gray-500 w-16">Cant.</th>
                        <th className="px-2 py-2 text-center text-gray-500 w-22">P.Venta c/IGV</th>
                        <th className="px-2 py-2 text-center text-gray-500 w-18">%IGV</th>
                        <th className="px-2 py-2 text-center text-gray-500 w-16">T.Desc</th>
                        <th className="px-2 py-2 text-right text-gray-500 w-20">Desc.Unit</th>
                        <th className="px-2 py-2 text-right text-gray-500 w-18">P.Venta Final</th>
                        <th className="px-2 py-2 text-right text-gray-500 w-18">Total</th>
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

                            {/* Buscador producto */}
                            <td className="px-2 py-1.5" style={{ overflow: 'visible', position: 'relative' }}>
                              <input ref={el => { inputRefs.current[i] = el; }} type="text" value={busquedaProducto[i] ?? ''}
                                onChange={(e) => {
                                  const nb = [...busquedaProducto]; nb[i] = e.target.value; setBusquedaProducto(nb);
                                  const nd = [...showDropdownProducto]; nd[i] = true; setShowDropdownProducto(nd);
                                }}
                                onFocus={() => { const nd = [...showDropdownProducto]; nd[i] = true; setShowDropdownProducto(nd); }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    const nd = [...showDropdownProducto]; nd[i] = false; setShowDropdownProducto(nd);
                                  }, 150)
                                  // ✅ si no seleccionó producto, tomar el texto como descripción
                                  const textoEscrito = busquedaProducto[i] ?? ''
                                  if (textoEscrito && (!detalles[i]?.productoId || detalles[i]?.productoId === 0)) {
                                    const nuevos = [...detalles]
                                    nuevos[i] = { ...nuevos[i], descripcion: textoEscrito, productoId: null, codigo: null }
                                    setDetalles(nuevos)
                                  }
                                }}
                                placeholder="Buscar o agrega producto..."
                                className="w-full py-1 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue"
                              />
                              {showDropdownProducto[i] && (() => {
                                const rect = inputRefs.current[i]?.getBoundingClientRect();
                                return (
                                  <div style={{ position: 'fixed', zIndex: 9999, top: (rect?.bottom ?? 0) + window.scrollY + 4, left: rect?.left ?? 0, width: '260px' }}
                                    className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                                    {productosSucursal.filter((p: ProductoSucursal) =>
                                      (busquedaProducto[i] ?? '').length === 0 ? true :
                                        p.nomProducto.toLowerCase().includes((busquedaProducto[i] ?? '').toLowerCase()) ||
                                        p.codigo.includes(busquedaProducto[i] ?? ''))
                                      .map((p: ProductoSucursal) => (
                                        <button key={p.productoId} type="button" onMouseDown={() => seleccionarProducto(p, i)}
                                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                          <p className="text-xs font-medium text-gray-800">{p.nomProducto}</p>
                                          <p className="text-[10px] text-gray-400">{p.codigo} · {simbolo} {p.sucursalProducto.precioUnitario.toFixed(2)}</p>
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

                            {/* Precio venta con IGV — editable */}
                            <td className="px-2 py-1.5">
                              <input type="number" min={0} step="0.01"
                                value={d._precioVentaConIGV ?? d.precioVenta ?? 0}
                                onChange={(e) => actualizarPrecioVenta(i, Number(e.target.value))}
                                className="w-full py-1 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right outline-none focus:border-brand-blue font-mono" />
                            </td>

                            {/* %IGV — solo editable si gravado */}
                            <td className="px-2 py-1.5">
                              {d.tipoAfectacionIGV === '10' ? (
                                <select
                                  value={d.porcentajeIGV ?? IGV_DEFAULT}
                                  onChange={(e) => actualizarPorcentajeIGV(i, Number(e.target.value))}
                                  className="w-full py-1 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue">
                                  <option value={18}>18</option>
                                  <option value={10.5}>10.5</option>
                                </select>
                              ) : (
                                <span className="block text-center text-gray-400 text-xs">N/A</span>
                              )}
                            </td>

                            {/* Tipo descuento */}
                            <td className="px-2 py-1.5">
                              <select value={d.codigoTipoDescuento ?? '01'}
                                onChange={(e) => actualizarCodigoDescuento(i, e.target.value)}
                                className="w-full py-1 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue">
                                <option value="01">01 - No afecta base</option>
                                <option value="00">00 - Afecta base</option>
                              </select>
                            </td>

                            {/* Descuento unitario */}
                            <td className="px-2 py-1.5">
                              <input type="number" min={0} step="0.01" value={d.descuentoUnitario ?? 0}
                                onChange={(e) => actualizarDescuento(i, Number(e.target.value))}
                                className="w-full py-1 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right outline-none focus:border-brand-blue font-mono" />
                            </td>

                            {/* Precio venta final (con descuento aplicado) */}
                            <td className="px-2 py-1.5 text-right font-mono text-gray-700 text-xs">
                              {(d.precioVenta ?? 0).toFixed(2)}
                            </td>

                            {/* Total ítem */}
                            <td className="px-2 py-1.5 text-right font-mono font-semibold text-gray-800 text-xs">
                              {(d.totalVentaItem ?? 0).toFixed(2)}
                            </td>

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
                    <button type="button" onClick={agregarGuia} className="text-xs text-brand-blue hover:underline flex items-center gap-1 pt-1">
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
                      <span className="font-medium text-gray-900 w-24">{simbolo} {totales.gravadas.toFixed(2)}</span>
                    </div>
                  )}
                  {totales.exoneradas > 0 && (
                    <div className="flex justify-end gap-8 text-sm text-gray-500">
                      <span>Op. Exoneradas:</span>
                      <span className="font-medium text-gray-900 w-24">{simbolo} {totales.exoneradas.toFixed(2)}</span>
                    </div>
                  )}
                  {totales.inafectas > 0 && (
                    <div className="flex justify-end gap-8 text-sm text-gray-500">
                      <span>Op. Inafectas:</span>
                      <span className="font-medium text-gray-900 w-24">{simbolo} {totales.inafectas.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-8 text-sm text-gray-500">
                    <span>IGV:</span>
                    <span className="font-medium text-gray-900 w-24">{simbolo} {totales.igv.toFixed(2)}</span>
                  </div>
                  {totales.totalDescuentos > 0 && (
                    <div className="flex justify-end gap-8 text-sm text-gray-500">
                      <span>Descuentos:</span>
                      <span className="font-medium text-red-500 w-24">-{simbolo} {totales.totalDescuentos.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Descuento global con tipo */}
                  <div className="flex justify-end gap-2 items-center">
                    <span className="text-sm text-gray-500">Desc. Global:</span>
                    <select value={codigoTipoDescGlobal} onChange={(e) => setCodigoTipoDescGlobal(e.target.value)}
                      className="py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue">
                      <option value="03">03 - No afecta base</option>
                      <option value="02">02 - Afecta base gravada</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-400">{simbolo}</span>
                      <input type="number" min={0} step="0.01" value={descuentoGlobal}
                        onChange={(e) => setDescuentoGlobal(Number(e.target.value))}
                        className="w-24 py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-brand-blue font-mono" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-8 text-lg font-bold text-brand-blue pt-1 border-t border-gray-100">
                    <span>Total:</span>
                    <span className="w-24">{simbolo} {totales.importeTotal.toFixed(2)}</span>
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
              <Button className="w-full py-3 text-base" type="button" onClick={emitirComprobante} disabled={emitiendo}>
                {emitiendo ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Emitiendo...
                  </span>
                ) : 'Emitir Comprobante'}
              </Button>
              {errorEmision && <p className="text-xs text-red-500 text-center">{errorEmision}</p>}
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