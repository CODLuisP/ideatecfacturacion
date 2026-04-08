"use client";
import { Plus, Trash2, ShieldCheck, Zap, Download, Printer, X, UserRound, ClipboardList } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useMemo, useRef } from 'react';
import { formatoFechaActual } from '@/app/components/ui/formatoFecha';
import { numeroALetras } from '@/app/components/ui/numeroALetras';
import { useToast } from '@/app/components/ui/Toast';
import axios from 'axios';
import { Cliente } from '../clientes/gestionClientes/Cliente';
import { useClientesRuc } from '../clientes/gestionClientes/useClientesRuc';
import { useClienteBoleta } from '../emision/boleta/gestionBoletas/useClienteBoleta';
import { useEmpresaEmisor } from '../emision/boleta/gestionBoletas/useEmpresaEmisor';
import { useSucursal } from '../emision/boleta/gestionBoletas/useSucursal';
import { useSucursalRuc } from '../emision/boleta/gestionBoletas/useSucursalRuc';
import { useClienteFactura } from '../emision/factura/gestionFacturas/useClienteFactura';
import { ProductoSucursal } from '../productos/gestioProductos/Producto';
import { useProductosSucursal } from '../productos/gestioProductos/useProductosSucursal';

// ── Tipos ──────────────────────────────────────────────────────
type TipoComprobante = 'boleta' | 'factura';

interface ItemRapido {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;   // base sin IGV
  precioVentaConIGV: number;
  porcentajeIGV: number;
  productoId: number | null;
  unidadMedida: string;
  codigo: string | null;
  tipoAfectacionIGV: string;
  _sucursalProductoId?: number;
  _tipoProducto?: string | null;
  _stockDisponible?: number | null;
  _esIcbper?: boolean;
}

const IGV_DEFAULT = 18;
const ICBPER_FACTOR = 0.50;
const PRECIOS_BOLSA = { pequeña: 0.10, mediana: 0.20, grande: 0.30 };
const MEDIOS_PAGO = ['Efectivo', 'Tarjeta', 'Yape', 'Plin', 'Transferencia'];

// ── Cálculo de item ────────────────────────────────────────────
function calcItem(item: ItemRapido) {
  if (item._esIcbper) {
    const baseIgv = parseFloat((item.precioUnitario * item.cantidad).toFixed(2));
    return { baseIgv, montoIGV: 0, totalVentaItem: baseIgv, valorVenta: baseIgv };
  }
  const baseIgv = parseFloat((item.precioUnitario * item.cantidad).toFixed(2));
  if (item.tipoAfectacionIGV === '10') {
    const montoIGV = parseFloat((baseIgv * item.porcentajeIGV / 100).toFixed(2));
    const totalVentaItem = parseFloat((item.precioVentaConIGV * item.cantidad).toFixed(2));
    return { baseIgv, montoIGV, totalVentaItem, valorVenta: baseIgv };
  }
  // exonerado (20) / inafecto (30)
  return { baseIgv, montoIGV: 0, totalVentaItem: baseIgv, valorVenta: baseIgv };
}

export default function EmisionRapidaPage() {
  const { showToast } = useToast();
  const { accessToken, user } = useAuth();
  const isSuperAdmin = user?.rol === 'superadmin';
  const { empresa } = useEmpresaEmisor();
  
  //sucursales tanto para admin y superadmin
  const { sucursal, loadingSucursal } = useSucursal();
  const { sucursales, loadingSucursales } = useSucursalRuc(isSuperAdmin);

  // ── Tipo comprobante ───────────────────────────────────────
  const [tipo, setTipo] = useState<TipoComprobante>('boleta');

  // ── Hooks cliente ──────────────────────────────────────────
  const { cliente: clienteBoleta, loadingCliente: loadingB, errorCliente: errorB, buscarCliente: buscarB } = useClienteBoleta();
  const { cliente: clienteFactura, loadingCliente: loadingF, errorCliente: errorF, buscarCliente: buscarF } = useClienteFactura();
  const cliente    = tipo === 'boleta' ? clienteBoleta : clienteFactura;
  const loadingCli = tipo === 'boleta' ? loadingB      : loadingF;
  const errorCli   = tipo === 'boleta' ? errorB        : errorF;
  const buscarCli  = tipo === 'boleta' ? buscarB       : buscarF;
  const { clientes } = useClientesRuc();

  // ── Estado cliente ─────────────────────────────────────────
  const [tipoDoc, setTipoDoc] = useState('01');
  const [busqueda, setBusqueda] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [clienteVarios, setClienteVarios] = useState(false);
  const [clienteManual, setClienteManual] = useState('');
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{
    clienteId: number | null;
    tipoDocumento: string;
    numeroDocumento: string;
    razonSocial: string;
    ubigeo: string;
    direccionLineal: string;
    departamento: string;
    provincia: string;
    distrito: string;
  } | null>(null);
  const [correoCliente, setCorreoCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [enviarCorreo, setEnviarCorreo] = useState(false);
  const [enviarWhatsapp, setEnviarWhatsapp] = useState(false);

  //comprobante sin detalle
  const [porConsumo, setPorConsumo] = useState(false);

  // Al cambiar tipo → resetear cliente
  useEffect(() => {
    setTipoDoc(tipo === 'factura' ? '06' : '01');
    setBusqueda('');
    setClienteSeleccionado(null);
    setClienteVarios(false);
    setCorreoCliente('');
    setTelefonoCliente('');
    setEnviarCorreo(false);
    setEnviarWhatsapp(false);
    if (isSuperAdmin) {
    setSucursalActual(null); 
    setCorrelativoActual(null); 
  }
  }, [tipo]);

  // Sincronizar cliente desde hook (búsqueda API)
  useEffect(() => {
    if (!cliente) return;
    setNoEncontrado(false);
    setClienteSeleccionado({
      clienteId: null,
      tipoDocumento: (cliente as any).tipoDocumento ?? tipoDoc,
      numeroDocumento: (cliente as any).numeroDocumento ?? '',
      razonSocial: (cliente as any).razonSocial ?? '',
      ubigeo: (cliente as any).ubigeo ?? '',
      direccionLineal: (cliente as any).direccionLineal ?? '',
      departamento: (cliente as any).departamento ?? '',
      provincia: (cliente as any).provincia ?? '',
      distrito: (cliente as any).distrito ?? '',
    });
    setCorreoCliente('');
    setTelefonoCliente('');
    setEnviarCorreo(false);
    setEnviarWhatsapp(false);
  }, [cliente]);

  useEffect(() => {
    if (errorCli) setNoEncontrado(true); setErrorVisible(true);
  }, [errorCli]);

  // Clientes varios — limpia contacto, no muestra dirección
  useEffect(() => {
    if (clienteVarios) {
      setTipoDoc('00');
      setClienteSeleccionado({
        clienteId: null, tipoDocumento: '0', numeroDocumento: '0',
        razonSocial: 'Clientes Varios', ubigeo: '', direccionLineal: '',
        departamento: '', provincia: '', distrito: '',
      });
      setBusqueda('');
      setShowDropdown(false);
      setCorreoCliente('');
      setTelefonoCliente('');
      setEnviarCorreo(false);
      setEnviarWhatsapp(false);
      setErrorVisible(false);
    } else {
      setClienteSeleccionado(null);
      setBusqueda('');
      setTipoDoc('01');
    }
  }, [clienteVarios]);

  // Buscar automático por longitud
  useEffect(() => {
    if (clienteVarios) return;
    const lon = tipoDoc === '01' ? 8 : tipoDoc === '06' ? 11 : 12;
    if (!lon || busqueda.length !== lon) return;
    const yaEsta = clientes.some(c => c.numeroDocumento === busqueda);
    if (!yaEsta) buscarCli(tipoDoc, busqueda);
  }, [busqueda, tipoDoc, clientes, clienteVarios]);

  const clientesFiltrados = clientes.filter(c => {
    if (tipo === 'factura') {
      if (c.tipoDocumento.tipoDocumentoId !== '06' && c.tipoDocumento.tipoDocumentoId !== '04') return false;
      if (c.tipoDocumento.tipoDocumentoId !== tipoDoc) return false;
    } else {
      if (c.tipoDocumento.tipoDocumentoId !== tipoDoc) return false;
    }
    if (!busqueda) return true;
    return c.numeroDocumento.includes(busqueda) || c.razonSocialNombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const seleccionarDeLista = (c: Cliente) => {
    setBusqueda(c.numeroDocumento);
    setShowDropdown(false);
    const dir = c.direccion?.[0];
    setCorreoCliente(c.correo ?? '');
    setTelefonoCliente(c.telefono ?? '');
    setEnviarCorreo(false);
    setEnviarWhatsapp(false);
    setClienteSeleccionado({
      clienteId: c.clienteId, tipoDocumento: c.tipoDocumento.tipoDocumentoId,
      numeroDocumento: c.numeroDocumento, razonSocial: c.razonSocialNombre,
      ubigeo: dir?.ubigeo ?? '', direccionLineal: dir?.direccionLineal ?? '',
      departamento: dir?.departamento ?? '', provincia: dir?.provincia ?? '',
      distrito: dir?.distrito ?? '',
    });
  };

  // ── Serie / correlativo ────────────────────────────────────
  const [sucursalActual, setSucursalActual] = useState<any>(null);
  const [correlativoActual, setCorrelativoActual] = useState<number | null>(null);

  useEffect(() => {
    if (!sucursal) return;
    if (isSuperAdmin) return; // ← superadmin elige manualmente
    setSucursalActual(sucursal);
    setCorrelativoActual(tipo === 'boleta' ? sucursal.correlativoBoleta : sucursal.correlativoFactura);
  }, [sucursal, tipo]);

  const serie = tipo === 'boleta' ? (sucursalActual?.serieBoleta ?? '') : (sucursalActual?.serieFactura ?? '');

  //cargamos productos de acuerdo a al rol
  const { productosSucursal, fetchProductosSucursal  } = useProductosSucursal( isSuperAdmin ? sucursalActual?.sucursalId : undefined );

  //sin sucursal seleccionada
  const sinSucursal = isSuperAdmin && !sucursalActual;

  // ── Moneda ─────────────────────────────────────────────────
  const [tipoMoneda, setTipoMoneda] = useState('PEN');
  const [tipoCambio] = useState(3.75);
  const simbolo = tipoMoneda === 'USD' ? '$' : 'S/';
  const monedaAnteriorRef = useRef('PEN');

  // ── Medio de pago ──────────────────────────────────────────
  const [medioPago, setMedioPago] = useState('Efectivo');

  // ── Items ──────────────────────────────────────────────────
  const [items, setItems] = useState<ItemRapido[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState<string[]>([]);
  const [showDropdownProducto, setShowDropdownProducto] = useState<boolean[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  //por consumo sin detalle
  useEffect(() => {
    if (porConsumo) {
      setItems(prev => {
        const sinBolsa = prev.filter(i => i._esIcbper);
        const consumoItem: ItemRapido = {
          id: 'por-consumo',
          descripcion: 'Por Consumo',
          cantidad: 1,
          precioUnitario: 0,
          precioVentaConIGV: 0,
          porcentajeIGV: IGV_DEFAULT,
          tipoAfectacionIGV: '10',
          productoId: null,
          unidadMedida: 'ZZ',
          codigo: null,
        };
        return [consumoItem, ...sinBolsa];
      });
      setBusquedaProducto(prev => ['Por Consumo', ...prev.filter((_, i) => items[i]?._esIcbper)]);
      setShowDropdownProducto(prev => [false, ...prev.filter((_, i) => items[i]?._esIcbper)]);
    } else {
      setItems(prev => prev.filter(i => i.id !== 'por-consumo'));
      setBusquedaProducto(prev => prev.filter((_, i) => items[i]?.id !== 'por-consumo'));
      setShowDropdownProducto(prev => prev.filter((_, i) => items[i]?.id !== 'por-consumo'));
    }
  }, [porConsumo]);

  // Al cambiar moneda — recalcular precios de items normales
  useEffect(() => {
    const anterior = monedaAnteriorRef.current;
    if (anterior === tipoMoneda) return;
    monedaAnteriorRef.current = tipoMoneda;
    if (items.length === 0) return;
    setItems(prev => prev.map(item => {
      if (item._esIcbper) return item;
      // Recalcular desde el precio base original para evitar errores de redondeo acumulado
      let pb: number;
      if (tipoMoneda === 'USD' && anterior === 'PEN') {
        pb = parseFloat((item.precioUnitario / tipoCambio).toFixed(6));
      } else if (tipoMoneda === 'PEN' && anterior === 'USD') {
        pb = parseFloat((item.precioUnitario * tipoCambio).toFixed(6));
      } else {
        pb = item.precioUnitario;
      }
      // Calcular precioVenta desde la base, sin redondeo intermedio
      const pv = parseFloat((pb * (1 + item.porcentajeIGV / 100)).toFixed(2));
      return { ...item, precioUnitario: pb, precioVentaConIGV: pv };
    }));
  }, [tipoMoneda]);

  const agregarItem = () => {
    const nuevo: ItemRapido = {
      id: crypto.randomUUID(), descripcion: '', cantidad: 1,
      precioUnitario: 0, precioVentaConIGV: 0, porcentajeIGV: IGV_DEFAULT, tipoAfectacionIGV: '10',
      productoId: null, unidadMedida: 'NIU', codigo: null,
    };
    setItems(prev => [...prev.filter(i => !i._esIcbper), nuevo, ...prev.filter(i => i._esIcbper)]);
    setBusquedaProducto(prev => {
      const sb = prev.filter((_, i) => !items[i]?._esIcbper);
      return [...sb, '', ...prev.filter((_, i) => items[i]?._esIcbper)];
    });
    setShowDropdownProducto(prev => {
      const sb = prev.filter((_, i) => !items[i]?._esIcbper);
      return [...sb, false, ...prev.filter((_, i) => items[i]?._esIcbper)];
    });
    inputRefs.current = [
      ...inputRefs.current.filter((_, i) => !items[i]?._esIcbper),
      null,
      ...inputRefs.current.filter((_, i) => items[i]?._esIcbper),
    ];
  };

  const eliminarItem = (index: number) => {
    setPorConsumo(false);
    if (items[index]?._esIcbper) { setCantidadBolsa(0); return; }
    setItems(prev => prev.filter((_, i) => i !== index));
    setBusquedaProducto(prev => prev.filter((_, i) => i !== index));
    setShowDropdownProducto(prev => prev.filter((_, i) => i !== index));
    inputRefs.current = inputRefs.current.filter((_, i) => i !== index);
  };

  const actualizarCampo = (index: number, campo: keyof ItemRapido, valor: any) => {
    setItems(prev => {
      const nuevos = [...prev];
      const item = { ...nuevos[index], [campo]: valor };
      if (campo === 'precioVentaConIGV') {
        const pv = Number(valor);
        item.precioUnitario = parseFloat((pv / (1 + item.porcentajeIGV / 100)).toFixed(6));
        item.precioVentaConIGV = pv;
      }
      if (campo === 'porcentajeIGV') {
        const pct = Number(valor);
        item.precioUnitario = parseFloat((item.precioVentaConIGV / (1 + pct / 100)).toFixed(6));
        item.porcentajeIGV = pct;
      }
      nuevos[index] = item;
      return nuevos;
    });
  };

  const actualizarCantidad = (index: number, delta: number) => {
    setItems(prev => {
      const nuevos = [...prev];
      const item = nuevos[index];
      const esBien = item._tipoProducto === 'BIEN';
      const stock = item._stockDisponible;
      let nueva = Math.max(1, (item.cantidad ?? 1) + delta);
      if (esBien && stock != null && nueva > stock) {
        showToast(`Stock insuficiente. Disponible: ${stock}`, 'error');
        nueva = stock;
      }
      nuevos[index] = { ...item, cantidad: nueva };
      return nuevos;
    });
  };

  const seleccionarProducto = (producto: ProductoSucursal, index: number) => {
    // Bloquear duplicado — sumar cantidad al existente
    const existente = items.findIndex((it, i) => i !== index && it.productoId === producto.productoId && !it._esIcbper);
      if (
        producto.nomProducto.toUpperCase().includes('BOLSA PLASTICA') ||
        producto.nomProducto.toUpperCase().includes('BOLSA PLÁSTICA')
      ) {
        setCantidadBolsa(prev => prev + 1);
        eliminarItem(index);
        showToast('Usa el contador de bolsa plástica abajo', 'info');
        return;
      }
    if (existente !== -1) {
      setItems(prev => {
        const nuevos = [...prev];
        const sumado = (nuevos[existente].cantidad ?? 1) + (nuevos[index]?.cantidad ?? 1);
        const stock = nuevos[existente]._stockDisponible;
        nuevos[existente] = { ...nuevos[existente], cantidad: stock != null ? Math.min(sumado, stock) : sumado };
        return nuevos.filter((_, i) => i !== index);
      });
      setBusquedaProducto(prev => prev.filter((_, i) => i !== index));
      setShowDropdownProducto(prev => prev.filter((_, i) => i !== index));
      inputRefs.current = inputRefs.current.filter((_, i) => i !== index);
      showToast(`Cantidad acumulada en ítem ${existente + 1}`, 'success');
      return;
    }

    const precioSistema = producto.sucursalProducto.precioUnitario;
    const precioEnMoneda = tipoMoneda === 'USD'
      ? parseFloat((precioSistema / tipoCambio).toFixed(6))
      : precioSistema;

    const ta = producto.tipoAfectacionIGV ?? '10';
    const pct = ta === '10' ? IGV_DEFAULT : 0;

    const precioBase = (ta === '10' && producto.incluirIGV)
      ? parseFloat((precioEnMoneda / (1 + pct / 100)).toFixed(6))
      : precioEnMoneda;

    const precioVenta = (ta === '10')
      ? (producto.incluirIGV
          ? precioEnMoneda
          : parseFloat((precioEnMoneda * (1 + pct / 100)).toFixed(2)))
      : precioEnMoneda; // exonerado/inafecto — precio venta = precio base

    setItems(prev => {
      const nuevos = [...prev];
      nuevos[index] = {
        ...nuevos[index],
        productoId: producto.productoId, codigo: producto.codigo,
        descripcion: producto.nomProducto, unidadMedida: producto.unidadMedida,
        porcentajeIGV: pct, precioUnitario: precioBase, precioVentaConIGV: precioVenta, tipoAfectacionIGV: ta,
        _sucursalProductoId: producto.sucursalProducto.sucursalProductoId,
        _tipoProducto: producto.tipoProducto, _stockDisponible: producto.sucursalProducto.stock,
      };
      return nuevos;
    });
    const nb = [...busquedaProducto]; nb[index] = producto.nomProducto; setBusquedaProducto(nb);
    const nd = [...showDropdownProducto]; nd[index] = false; setShowDropdownProducto(nd);
  };

  // ── Bolsa ICBPER ───────────────────────────────────────────
  const [cantidadBolsa, setCantidadBolsa] = useState(0);
  const [tamañoBolsa, setTamañoBolsa] = useState<'pequeña' | 'mediana' | 'grande'>('mediana');
  const [aplicarIcbper, setAplicarIcbper] = useState(false);
  const [showBolsaOpts, setShowBolsaOpts] = useState(false);

  useEffect(() => {
    if (productosSucursal.length === 0) return;
    const productoBolsa = productosSucursal.find((p: ProductoSucursal) =>
      p.nomProducto.toUpperCase().includes('BOLSA PLASTICA') ||
      p.nomProducto.toUpperCase().includes('BOLSA PLÁSTICA')
    );

    setItems(prev => {
      const sinBolsa = prev.filter(d => !d._esIcbper);
      if (cantidadBolsa === 0) return sinBolsa;
      const precioConIGV = PRECIOS_BOLSA[tamañoBolsa];
      const bolsaItem: ItemRapido = {
        id: 'bolsa-icbper',
        productoId: productoBolsa?.productoId ?? null,
        codigo: productoBolsa?.codigo ?? 'BOLSA',
        descripcion: `${productoBolsa?.nomProducto ?? 'BOLSA PLASTICA'} (${tamañoBolsa})`,
        cantidad: cantidadBolsa,
        unidadMedida: productoBolsa?.unidadMedida ?? 'NIU',
        precioUnitario: precioConIGV, precioVentaConIGV: precioConIGV,
        porcentajeIGV: 0, tipoAfectacionIGV: '20',
        _sucursalProductoId: productoBolsa?.sucursalProducto?.sucursalProductoId,
        _tipoProducto: productoBolsa?.tipoProducto ?? null,
        _stockDisponible: productoBolsa?.sucursalProducto?.stock ?? null,
        _esIcbper: true,
      };
      return [...sinBolsa, bolsaItem];
    });
    setBusquedaProducto(prev => {
      const sinBolsa = prev.filter((_, i) => !items[i]?._esIcbper);
      if (cantidadBolsa === 0) return sinBolsa;
      return [...sinBolsa, `BOLSA PLASTICA (${tamañoBolsa})`];
    });
  }, [cantidadBolsa, productosSucursal, tamañoBolsa, aplicarIcbper]);

  // ── Totales ────────────────────────────────────────────────
  const totales = useMemo(() => {
    let gravadas = 0, exoneradas = 0, inafectas = 0, igv = 0, totalIcbper = 0;
    for (const item of items) {
      const calc = calcItem(item);
      if (item._esIcbper) {
        exoneradas += calc.baseIgv;
        if (aplicarIcbper) totalIcbper += parseFloat((item.cantidad * ICBPER_FACTOR).toFixed(2));
      } else if (item.tipoAfectacionIGV === '10') {
        gravadas += calc.baseIgv;
        igv += calc.montoIGV;
      } else if (item.tipoAfectacionIGV === '20') {
        exoneradas += calc.baseIgv;
      } else if (item.tipoAfectacionIGV === '30') {
        inafectas += calc.baseIgv;
      }
    }
    gravadas    = parseFloat(gravadas.toFixed(2));
    exoneradas  = parseFloat(exoneradas.toFixed(2));
    inafectas   = parseFloat(inafectas.toFixed(2));
    igv         = parseFloat(igv.toFixed(2));
    totalIcbper = parseFloat(totalIcbper.toFixed(2));
    const valorVenta   = parseFloat((gravadas + exoneradas + inafectas).toFixed(2));
    const importeTotal = parseFloat((valorVenta + igv + totalIcbper).toFixed(2));
    return { gravadas, exoneradas, inafectas, igv, totalIcbper, valorVenta, importeTotal };
  }, [items, aplicarIcbper]);

  // ── Emitir ─────────────────────────────────────────────────
  const [emitiendo, setEmitiendo] = useState(false);
  const [errorEmision, setErrorEmision] = useState<string | null>(null);
  const [comprobanteIdEmitido, setComprobanteIdEmitido] = useState<number | null>(null);

  const emitirComprobante = async () => {
    if (!clienteSeleccionado && !clienteVarios) { showToast('Debe ingresar un cliente', 'error'); return; }
    if (tipo === 'factura' && clienteSeleccionado?.tipoDocumento !== '06' && clienteSeleccionado?.tipoDocumento !== '04') {
      showToast('Para factura el cliente debe tener RUC o CE', 'error'); return;
    }
    const itemsReales = items.filter(i => !i._esIcbper);
    if (itemsReales.length === 0) { showToast('Debe agregar al menos un ítem', 'error'); return; }
    const sinDesc = itemsReales.findIndex(d => !d.descripcion?.trim());
    if (sinDesc !== -1) { showToast(`El ítem ${sinDesc + 1} no tiene descripción`, 'error'); return; }
    if (enviarCorreo && !correoCliente.trim()) { showToast('Ingrese el correo del cliente', 'error'); return; }

    setEmitiendo(true);
    setErrorEmision(null);
    setComprobanteIdEmitido(null);
    try {
      const { fechaHora: ahora, fecha: hoy } = formatoFechaActual();
      const clienteFinal = {
        ...clienteSeleccionado,
        tipoDocumento: tipo === 'factura' && clienteSeleccionado?.tipoDocumento === '06' ? '6' : clienteSeleccionado?.tipoDocumento,
      };
      const details = items.map((item, idx) => {
        const calc = calcItem(item);
        const icbper = item._esIcbper && aplicarIcbper ? parseFloat((item.cantidad * ICBPER_FACTOR).toFixed(2)) : 0;
        return {
          item: idx + 1,
          productoId: item.productoId, codigo: item.codigo,
          descripcion: item.descripcion, cantidad: item.cantidad,
          unidadMedida: item.unidadMedida,
          precioUnitario: item.precioUnitario,
          tipoAfectacionIGV: item._esIcbper ? '20' : (item.tipoAfectacionIGV ?? '10'),
          porcentajeIGV: item.porcentajeIGV,
          baseIgv: calc.baseIgv, montoIGV: calc.montoIGV,
          codigoTipoDescuento: '01', descuentoUnitario: 0, descuentoTotal: 0,
          valorVenta: calc.valorVenta,
          precioVenta: item.precioVentaConIGV,
          totalVentaItem: calc.totalVentaItem + icbper,
          icbper, factorIcbper: item._esIcbper && aplicarIcbper ? ICBPER_FACTOR : 0,
        };
      });

      const moneda = tipoMoneda === 'USD' ? 'DÓLARES' : 'SOLES';
      const payload = {
        ublVersion: '2.1', tipoOperacion: '0101',
        tipoComprobante: tipo === 'boleta' ? '03' : '01',
        tipoMoneda,
        tipoCambio: tipoMoneda === 'USD' ? tipoCambio : undefined,
        fechaEmision: ahora, horaEmision: ahora, fechaVencimiento: hoy,
        tipoPago: 'Contado',
        serie, correlativo: String(correlativoActual ?? 1).padStart(8, '0'),
        company: { ...empresa, establecimientoAnexo: sucursalActual?.codEstablecimiento ?? empresa?.establecimientoAnexo ?? '0000'},
        cliente: clienteFinal,
        details,
        pagos: [{ medioPago, monto: totales.importeTotal, fechaPago: ahora, numeroOperacion: '', entidadFinanciera: '', observaciones: '' }],
        cuotas: [], guias: [],
        totalOperacionesGravadas: totales.gravadas,
        totalOperacionesExoneradas: totales.exoneradas,
        totalOperacionesInafectas: totales.inafectas,
        totalIGV: totales.igv,
        totalIcbper: totales.totalIcbper,
        totalImpuestos: parseFloat((totales.igv + totales.totalIcbper).toFixed(2)),
        totalDescuentos: 0,
        subTotal: parseFloat((totales.valorVenta + totales.igv).toFixed(2)),
        importeTotal: totales.importeTotal,
        valorVenta: totales.valorVenta,
        montoCredito: 0,
        descuentoGlobal: 0, codigoTipoDescGlobal: '03',
        legends: [{ code: '1000', value: numeroALetras(totales.importeTotal, moneda) }],
      };
      console.log('comprobante:', payload);
      
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/GenerarXml`, payload, { headers: { Authorization: `Bearer ${accessToken}` } });
      const comprobanteId = res.data.comprobanteId;
      const resSunat = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobanteId}/enviar-sunat`, null, { headers: { Authorization: `Bearer ${accessToken}` } });

      if (resSunat.data.exitoso) {
        showToast(resSunat.data.mensaje ?? 'Comprobante emitido correctamente.', 'success');
        setComprobanteIdEmitido(comprobanteId);
        if (enviarCorreo && correoCliente) {
          try {
            const corrNum = String((correlativoActual ?? 1) - 1).padStart(8, '0');
            const serieNum = `${serie}-${corrNum}`;
            const esBoleta = tipo === 'boleta';

            // 1. Obtener PDF en memoria
            const resPdf = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobanteId}/pdf?tamano=A4`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!resPdf.ok) throw new Error('No se pudo obtener el PDF');
            const pdfBlob = await resPdf.blob();
            const pdfFile = new File([pdfBlob], `${empresa?.numeroDocumento}-${esBoleta ? 'Boleta' : 'Factura'}-${serieNum}.pdf`, { type: 'application/pdf' });

            // 2. Enviar correo con PDF adjunto
            const formData = new FormData();
            formData.append('toEmail', correoCliente);
            formData.append('toName', clienteSeleccionado?.razonSocial ?? 'Cliente');
            formData.append('subject', `Tu ${esBoleta ? 'boleta' : 'factura'} ${serieNum}`);
            formData.append('body', `Adjuntamos su ${esBoleta ? 'boleta de venta' : 'factura'} electrónica.`);
            formData.append('tipo', esBoleta ? '3' : '1');
            formData.append('adjunto', pdfFile);

            const resCorreo = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/email/send`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formData,
              }
            );
            if (!resCorreo.ok) throw new Error('Error al enviar el correo');
            showToast('Comprobante enviado por correo', 'success');
          } catch { 
            showToast('Error al enviar por correo', 'error'); 
          }
        }
        if (enviarWhatsapp && telefonoCliente) {
          try { await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobanteId}/enviar-whatsapp`, { telefono: telefonoCliente }, { headers: { Authorization: `Bearer ${accessToken}` } }); showToast('Enviado por WhatsApp', 'success'); }
          catch { showToast('Error al enviar por WhatsApp', 'error'); }
        }
      } else {
        showToast('Comprobante generado pero rechazado por SUNAT', 'error');
      }

      // Stock
      const itemsStock = items.filter(d => d.productoId && d._sucursalProductoId && d._tipoProducto === 'BIEN');
      if (itemsStock.length > 0) {
        try { await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/productos/actualizarstock`, itemsStock.map(d => ({ sucursalProductoId: d._sucursalProductoId, cantidad: d.cantidad })), { headers: { Authorization: `Bearer ${accessToken}` } }); await fetchProductosSucursal(); } catch {}
      }

      // Correlativo nuevo
      const sucursalId = isSuperAdmin ? sucursalActual?.sucursalId : user?.sucursalID;
      const resSucursal = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${sucursalId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setCorrelativoActual(tipo === 'boleta' ? resSucursal.data.correlativoBoleta : resSucursal.data.correlativoFactura);

      // Auto-guardar cliente si vino de API o fue ingresado manualmente
      const esClienteNuevo = clienteSeleccionado?.clienteId === null && clienteSeleccionado?.razonSocial;
      const tieneContacto = (correoCliente && enviarCorreo) || (telefonoCliente && enviarWhatsapp);

      if (esClienteNuevo && tieneContacto) {
        try {
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/Cliente`,
            {
              sucursalID: isSuperAdmin ? sucursalActual?.sucursalId : user?.sucursalID,
              numeroDocumento: clienteSeleccionado.numeroDocumento,
              razonSocialNombre: clienteSeleccionado.razonSocial,
              nombreComercial: '',
              telefono: telefonoCliente || '',
              correo: correoCliente || '',
              tipoDocumentoId: clienteSeleccionado.tipoDocumento,
              direccion: clienteSeleccionado.tipoDocumento === '01' 
              ? {} 
              : {
                  ubigeo: clienteSeleccionado.ubigeo ?? '',
                  direccionLineal: clienteSeleccionado.direccionLineal ?? '',
                  departamento: clienteSeleccionado.departamento ?? '',
                  provincia: clienteSeleccionado.provincia ?? '',
                  distrito: clienteSeleccionado.distrito ?? '',
                  tipoDireccion: 'PRINCIPAL',
                }
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        } catch { 
          // silencioso, no interrumpir el flujo
        }
      }

      resetForm();
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.mensaje ?? data?.message ?? 'Error al emitir el comprobante';
      const det = data?.detalle;
      setErrorEmision(det ? `${msg}: ${det}` : msg);
      showToast('Error al emitir comprobante.', 'error');
    } finally {
      setEmitiendo(false);
    }
  };

  const resetForm = () => {
    setItems([]); setBusquedaProducto([]); setShowDropdownProducto([]); inputRefs.current = [];
    setClienteSeleccionado(null); setBusqueda(''); setClienteVarios(false);
    setCorreoCliente(''); setTelefonoCliente(''); setNoEncontrado(false); setClienteManual('');
    setEnviarCorreo(false); setEnviarWhatsapp(false);
    setCantidadBolsa(0); setAplicarIcbper(false); setTamañoBolsa('mediana');
    setErrorEmision(null); setMedioPago('Efectivo'); setPorConsumo(false);
    if (isSuperAdmin) {
      setSucursalActual(null);
      setCorrelativoActual(null);
    }
  };

  const descargarPdf = async () => {
    if (!comprobanteIdEmitido) return;
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobanteIdEmitido}/pdf?tamano=A4`,
        { headers: { Authorization: `Bearer ${accessToken}` }, responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const ruc = empresa?.numeroDocumento ?? 'empresa';
      const tipoDoc = tipo === 'boleta' ? '03' : '01';
      const nombreArchivo = `${ruc}-${tipoDoc}-${serie}-${String((correlativoActual ?? 1)-1).padStart(8, '0')}.pdf`;
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      a.click();
    } catch { showToast('Error al descargar el PDF', 'error'); }
  };

  const imprimirPdf = async () => {
    if (!comprobanteIdEmitido) return;
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/${comprobanteIdEmitido}/pdf?tamano=Ticket58mm`,
        { headers: { Authorization: `Bearer ${accessToken}` }, responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    } catch { showToast('Error al imprimir el PDF', 'error'); }
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-2 animate-in fade-in duration-500 -mt-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-blue" />
            Emisión Rápida
          </h2>
          <p className="mx-7 text-sm text-gray-400 mt-0.5 font-stretch-50% tracking-wide pl-1">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              .replace(/^\w/, c => c.toUpperCase())}
          </p>
        </div>

        {/* Toggle Boleta / Factura */}
        <div className="flex items-center gap-1 bg-gray-100/80 border border-gray-200 p-1 rounded-xl">
          <button type="button" onClick={() => setTipo('boleta')}
            className={`px-6 py-2 rounded-lg text-xs font-semibold transition-colors border
              ${tipo === 'boleta'
                ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                : 'bg-blue-50 text-brand-blue border-blue-200 hover:bg-blue-100'}`}>
            Boleta
          </button>
          <button type="button" onClick={() => setTipo('factura')}
            className={`px-6 py-2 rounded-lg text-xs font-semibold transition-colors border
              ${tipo === 'factura'
                ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                : 'bg-blue-50 text-brand-blue border-blue-200 hover:bg-blue-100'}`}>
            Factura
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Columna izquierda ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Datos del Cliente ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-sm"><UserRound className="w-4 h-4 text-brand-blue" /></div>
              <h3 className="text-sm font-bold text-gray-800">Datos del Cliente</h3>
              {tipo === 'boleta' && (
                <label className="ml-auto flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={clienteVarios} onChange={e => setClienteVarios(e.target.checked)} className="w-3.5 h-3.5 accent-brand-blue" />
                  <span className="text-xs text-gray-500">Clientes Varios</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo doc + búsqueda */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  {tipo === 'factura' ? 'RUC / CE' : 'Tipo y Nº Documento'}
                </label>
                <div className="flex gap-2">
                  {tipo === 'boleta' ? (
                    <select value={tipoDoc} onChange={e => { setTipoDoc(e.target.value); setBusqueda(''); setClienteSeleccionado(null); setErrorVisible(false); }}
                      disabled={clienteVarios}
                      className="w-1/3 py-2.5 px-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-blue disabled:opacity-50">
                      <option value="00" disabled hidden>—</option>
                      <option value="01">DNI</option>
                      <option value="06">RUC</option>
                      <option value="04">CE</option>
                    </select>
                  ) : (
                    <select value={tipoDoc} onChange={e => { setTipoDoc(e.target.value); setBusqueda(''); setClienteSeleccionado(null); }}
                      className="w-1/3 py-2.5 px-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-blue">
                      <option value="06">RUC</option>
                      <option value="04">CE</option>
                    </select>
                  )}
                  <div className="relative w-2/3">
                    <input type="text"
                      value={clienteVarios ? '00000000' : busqueda}
                      disabled={clienteVarios}
                      onChange={e => {
                        setBusqueda(e.target.value); setShowDropdown(true);
                        if (e.target.value.length < busqueda.length || !e.target.value) {
                          setClienteSeleccionado(null);
                          setNoEncontrado(false); setClienteManual('');
                          setCorreoCliente(''); setTelefonoCliente('');
                          setEnviarCorreo(false); setEnviarWhatsapp(false);
                          setErrorVisible(false);
                        }
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      maxLength={tipoDoc === '01' ? 8 : tipoDoc === '06' ? 11 : 12}
                      placeholder={tipoDoc === '06' ? '11 dígitos RUC' : tipoDoc === '01' ? '8 dígitos DNI' : 'Nº documento'}
                      className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all disabled:opacity-50"
                    />
                    {loadingCli && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />}
                    {showDropdown && clientesFiltrados.length > 0 && !clienteVarios && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {clientesFiltrados.map(c => (
                          <button key={c.clienteId} type="button" onMouseDown={() => seleccionarDeLista(c)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                            <span className="text-xs text-gray-800">{c.numeroDocumento} — {c.razonSocialNombre}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Razón social */}
                  <input type="text"
                    disabled={clienteVarios || !noEncontrado}
                    value={clienteVarios ? 'Clientes Varios' : (clienteSeleccionado?.razonSocial ?? clienteManual)}
                    onChange={e => {
                      setClienteManual(e.target.value);
                      setErrorVisible(e.target.value.length === 0);
                      setClienteSeleccionado({
                        clienteId: null,
                        tipoDocumento: tipoDoc,
                        numeroDocumento: busqueda,
                        razonSocial: e.target.value,
                        ubigeo: '', direccionLineal: '',
                        departamento: '', provincia: '', distrito: '',
                      });
                    }}
                    placeholder="Nombre / Razón social"
                    className="w-full py-2.5 px-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 text-sm"
                  />
                {errorCli && errorVisible && <p className="text-xs text-red-500">{errorCli} Digitar nombre manualmente.</p>}
              </div>

              {/* Correo y teléfono */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Contacto</label>
                <div className={`flex items-center gap-1.5 bg-gray-50 border rounded-xl px-3 py-2.5
                  ${enviarCorreo && !correoCliente ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <input type="email" value={correoCliente}
                    onChange={e => { setCorreoCliente(e.target.value); if (!e.target.value) setEnviarCorreo(false); }}
                    disabled={!clienteSeleccionado || clienteVarios}
                    placeholder="Correo del cliente"
                    className="flex-1 bg-transparent text-sm outline-none min-w-0 placeholder:text-gray-400 disabled:opacity-40" />
                  <label className="flex items-center gap-1 shrink-0 cursor-pointer">
                    <input type="checkbox" checked={enviarCorreo} onChange={e => setEnviarCorreo(e.target.checked)} disabled={!correoCliente} className="w-3.5 h-3.5 accent-brand-blue" />
                    <span className="text-xs text-gray-500">Enviar</span>
                  </label>
                </div>
                <div className={`flex items-center gap-1.5 bg-gray-50 border rounded-xl px-3 py-2.5
                  ${enviarWhatsapp && !telefonoCliente ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <input type="tel" value={telefonoCliente}
                    onChange={e => {
                      const soloNumeros = e.target.value.replace(/\D/g, '');
                      setTelefonoCliente(soloNumeros);
                      if (!soloNumeros) setEnviarWhatsapp(false);
                    }}
                    disabled={!clienteSeleccionado || clienteVarios}
                    maxLength={9}
                    placeholder="Teléfono / WhatsApp"
                    className="flex-1 bg-transparent text-sm outline-none min-w-0 placeholder:text-gray-400 disabled:opacity-40" 
                  />
                  <label className="flex items-center gap-1 shrink-0 cursor-pointer">
                    <input type="checkbox" checked={enviarWhatsapp} onChange={e => setEnviarWhatsapp(e.target.checked)} disabled={!telefonoCliente} className="w-3.5 h-3.5 accent-brand-blue" />
                    <span className="text-xs text-gray-500">Enviar</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ── Detalle de Venta ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"> <ClipboardList className="w-4 h-4 text-brand-blue" /> </div>
                <h3 className="text-sm font-bold text-gray-800">Detalle de Venta</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Checkbox por consumo */}
                <label className={`flex items-center gap-1.5 select-none ml-2 ${sinSucursal ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" checked={porConsumo}
                    onChange={e => { if (sinSucursal) return; setPorConsumo(e.target.checked); }}
                    disabled={sinSucursal}
                    className="w-3.5 h-3.5 accent-brand-blue" />
                  <span className="text-xs text-gray-500">Por Consumo</span>
                </label>
                {!porConsumo && (
                  <button type="button" onClick={agregarItem}
                    disabled={sinSucursal}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Agregar ítem
                  </button>
                )}
              </div>
              
            </div>

            <div className="border border-gray-100 rounded-xl overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: '560px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2.5 text-left text-gray-400 font-semibold w-6">#</th>
                    <th className="px-2 py-2.5 text-left text-gray-400 font-semibold">Descripción</th>
                    <th className="px-2 py-2.5 text-center text-gray-400 font-semibold w-24">Cantidad</th>
                    <th className="px-2 py-2.5 text-center text-gray-400 font-semibold w-16">% IGV</th>
                    <th className="px-2 py-2.5 text-right text-gray-400 font-semibold w-28">P. Unit ({simbolo})</th>
                    <th className="px-2 py-2.5 text-right text-gray-400 font-semibold w-20">Total</th>
                    <th className="px-2 py-2.5 w-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-400">
                        Sin ítems. Haz clic en "Agregar ítem" para comenzar.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, i) => {
                      const calc = calcItem(item);
                      const icbperItem = item._esIcbper && aplicarIcbper
                        ? parseFloat((item.cantidad * ICBPER_FACTOR).toFixed(2)) : 0;
                      const esPorConsumo = item.id === 'por-consumo';
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-2 py-2 text-gray-400">{i + 1}</td>

                          {/* Descripción + buscador */}
                          <td className="px-2 py-2" style={{ overflow: 'visible', position: 'relative' }}>
                            <input
                              ref={el => { inputRefs.current[i] = el; }}
                              type="text"
                              value={busquedaProducto[i] ?? item.descripcion}
                              disabled={item._esIcbper || esPorConsumo}
                              onChange={e => {
                                const nb = [...busquedaProducto]; nb[i] = e.target.value; setBusquedaProducto(nb);
                                const nd = [...showDropdownProducto]; nd[i] = true; setShowDropdownProducto(nd);
                                if (!item.productoId) actualizarCampo(i, 'descripcion', e.target.value);
                              }}
                              onFocus={() => { const nd = [...showDropdownProducto]; nd[i] = true; setShowDropdownProducto(nd); }}
                              onBlur={() => {
                                setTimeout(() => { const nd = [...showDropdownProducto]; nd[i] = false; setShowDropdownProducto(nd); }, 150);
                                const txt = busquedaProducto[i] ?? '';
                                if (txt && !item.productoId) actualizarCampo(i, 'descripcion', txt);
                              }}
                              placeholder="Buscar o escribir producto..."
                              className="w-full py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {showDropdownProducto[i] && !item._esIcbper && (() => {
                              const rect = inputRefs.current[i]?.getBoundingClientRect();
                              const filtrados = productosSucursal.filter((p: ProductoSucursal) =>
                                !(busquedaProducto[i] ?? '') ? true :
                                  p.nomProducto.toLowerCase().includes((busquedaProducto[i] ?? '').toLowerCase()) ||
                                  p.codigo.includes(busquedaProducto[i] ?? '')
                              );
                              if (!filtrados.length) return null;
                              return (
                                <div style={{ position: 'fixed', zIndex: 9999, top: (rect?.bottom ?? 0) + window.scrollY + 4, left: rect?.left ?? 0, width: '280px' }}
                                  className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                                  {filtrados.map((p: ProductoSucursal) => (
                                    <button key={p.productoId} type="button"
                                      disabled={p.tipoProducto === 'BIEN' && p.sucursalProducto.stock === 0}
                                      onMouseDown={() => { if (p.tipoProducto === 'BIEN' && p.sucursalProducto.stock === 0) return; seleccionarProducto(p, i); }}
                                      className={`w-full text-left px-3 py-2 border-b border-gray-50 last:border-0 ${p.tipoProducto === 'BIEN' && p.sucursalProducto.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                                      <p className="text-xs font-medium text-gray-800">{p.nomProducto}</p>
                                      <p className="text-[10px] text-gray-400">
                                        {p.codigo} · {simbolo} {p.sucursalProducto.precioUnitario.toFixed(2)}
                                        {p.tipoProducto === 'BIEN' && (
                                          <span className={p.sucursalProducto.stock === 0 ? ' text-red-400' : ' text-green-600'}>
                                            {p.sucursalProducto.stock === 0 ? ' · Sin stock' : ` · Stock: ${p.sucursalProducto.stock}`}
                                          </span>
                                        )}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Cantidad con +/- */}
                          <td className="px-2 py-2">
                            {item._esIcbper || esPorConsumo ? (
                              <span className="block text-center text-gray-500">{item.cantidad}</span>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={() => actualizarCantidad(i, -1)}
                                  className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-md text-gray-600 font-bold transition-colors">−</button>
                                <input type="number" min={1} value={item.cantidad}
                                  onChange={e => {
                                    const v = Number(e.target.value);
                                    if (v < 1) return;
                                    actualizarCantidad(i, v - item.cantidad);
                                  }}
                                  className="w-10 py-1 border border-gray-200 rounded-lg text-xs text-center bg-gray-50 outline-none focus:border-brand-blue" />
                                <button type="button" onClick={() => actualizarCantidad(i, 1)}
                                  className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-md text-gray-600 font-bold transition-colors">+</button>
                              </div>
                            )}
                          </td>

                          {/* % IGV */}
                          <td className="px-2 py-2">
                            {item._esIcbper || item.tipoAfectacionIGV !== '10' ? (
                              <span className="block text-center text-gray-400 text-[10px]">
                                {item._esIcbper ? 'Exon.' : item.tipoAfectacionIGV === '20' ? 'Exon.' : 'Inaf.'}
                              </span>
                            ) : (
                              <select value={item.porcentajeIGV}
                                onChange={e => actualizarCampo(i, 'porcentajeIGV', Number(e.target.value))}
                                className="w-full py-1.5 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-blue">
                                <option value={18}>18%</option>
                                <option value={10.5}>10.5%</option>
                                <option value={0}>0%</option>
                              </select>
                            )}
                          </td>

                          {/* Precio unit c/IGV */}
                          <td className="px-2 py-2">
                            <input type="number" min={0} step="0.01"
                              value={item.precioVentaConIGV}
                              disabled={item._esIcbper}
                              onChange={e => actualizarCampo(i, 'precioVentaConIGV', Number(e.target.value))}
                              className="w-full py-1.5 px-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right outline-none focus:border-brand-blue font-mono disabled:opacity-50 disabled:cursor-not-allowed" />
                          </td>

                          {/* Total */}
                          <td className="px-2 py-2 text-right font-mono font-semibold text-gray-800">
                            {(calc.totalVentaItem + icbperItem).toFixed(2)}
                          </td>

                          <td className="px-2 py-2">
                            <button type="button" onClick={() => eliminarItem(i)} className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bolsa ICBPER */}
            <div className="border border-amber-100 rounded-xl p-3 bg-amber-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800">¿Desea bolsa plástica?</span>
                  <button type="button" onClick={() => setShowBolsaOpts(!showBolsaOpts)}
                    className="text-[10px] text-amber-600 hover:text-amber-800 border border-amber-200 bg-white rounded-lg px-2 py-0.5 transition-colors">
                    Opciones {showBolsaOpts ? '▲' : '▼'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setCantidadBolsa(prev => Math.max(0, prev - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 font-bold">−</button>
                  <span className="w-8 text-center text-sm font-semibold text-amber-900">{cantidadBolsa}</span>
                  <button type="button" disabled={sinSucursal} onClick={() => setCantidadBolsa(prev => prev + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 font-bold">+</button>
                </div>
              </div>
              {showBolsaOpts && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-700 font-medium w-14">Tamaño:</span>
                    <div className="flex gap-1.5">
                      {(['pequeña', 'mediana', 'grande'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setTamañoBolsa(t)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors
                            ${tamañoBolsa === t ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-100'}`}>
                          {t.charAt(0).toUpperCase() + t.slice(1)} · S/ {PRECIOS_BOLSA[t].toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={aplicarIcbper} onChange={e => setAplicarIcbper(e.target.checked)} className="w-3.5 h-3.5 accent-amber-500" />
                    <span className="text-[10px] text-amber-700">
                      Aplicar ICBPER (S/ {ICBPER_FACTOR} por bolsa) — Total: S/ {(cantidadBolsa * ICBPER_FACTOR).toFixed(2)}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Selector sucursal superadmin */}
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sucursal</label>
                  {loadingSucursales && (
                    <div className="w-3 h-3 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <select
                  value={sucursalActual?.sucursalId ?? ''}
                  disabled={loadingSucursales}
                  onChange={async (e) => {
                    if (!e.target.value) {
                      setSucursalActual(null);
                      setCorrelativoActual(null);
                      setItems([]);
                      setBusquedaProducto([]);
                      setShowDropdownProducto([]);
                      setCantidadBolsa(0);
                      return;
                    }
                    const seleccionada = sucursales.find((s: any) => s.sucursalId === Number(e.target.value));
                    if (!seleccionada) return;
                    setSucursalActual(seleccionada);
                    setItems([]);
                    setBusquedaProducto([]);
                    setShowDropdownProducto([]);
                    setCantidadBolsa(0);

                    // Obtener correlativo actualizado
                    const res = await axios.get(
                      `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${seleccionada.sucursalId}`,
                      { headers: { Authorization: `Bearer ${accessToken}` } }
                    );
                    setCorrelativoActual(tipo === 'boleta' ? res.data.correlativoBoleta : res.data.correlativoFactura);
                  }}
                  className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-blue">
                  <option value="">Seleccionar sucursal</option>
                  {sucursales.map((s: any) => (
                    <option key={s.sucursalId} value={s.sucursalId}>
                      {tipo === 'boleta' ? s.serieBoleta : s.serieFactura} — {s.nombre ?? s.codEstablecimiento}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* Serie destacada */}
          <div className="bg-linear-to-br from-brand-blue to-blue-700 rounded-2xl p-2 text-white shadow-lg">
            <p className="text-xl font-black tracking-tight text-center drop-shadow-sm">
              {isSuperAdmin && !sucursalActual
                ? <span className="text-sm font-medium opacity-60">Seleccionar sucursal para ver serie y correlativo</span>
                : loadingSucursal
                ? <span className="opacity-50 animate-pulse">Cargando...</span>
                : !serie
                ? <span className="text-sm font-medium opacity-60">No se pudo cargar la serie</span>
                : `${serie}-${String(correlativoActual ?? 1).padStart(8, '0')}`
              }
            </p>
          </div>

          {/* ── Medio de Pago / Moneda ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tipo de Pago:</span>
              <span className="text-xs font-bold text-gray-800">Contado</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Medio de pago */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Medio de Pago</label>
                <select value={medioPago} onChange={e => setMedioPago(e.target.value)}
                  className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-blue">
                  {MEDIOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Moneda */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Moneda</label>
                <select value={tipoMoneda} onChange={e => setTipoMoneda(e.target.value)}
                  className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-blue">
                  <option value="PEN">PEN — Soles</option>
                  <option value="USD">USD — Dólares ({tipoCambio.toFixed(2)})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resumen de Pago */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">Resumen de Pago</h3>

            <div className="space-y-2">
              {totales.gravadas > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Op. Gravadas</span>
                  <span className="font-medium text-gray-700">{simbolo} {totales.gravadas.toFixed(2)}</span>
                </div>
              )}
              {totales.exoneradas > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Op. Exoneradas</span>
                  <span className="font-medium text-gray-700">{simbolo} {totales.exoneradas.toFixed(2)}</span>
                </div>
              )}
              {totales.inafectas > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Op. Inafectas</span>
                  <span className="font-medium text-gray-700">{simbolo} {totales.inafectas.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  IGV{' '}
                  {items.filter(i => !i._esIcbper).length > 0 && (
                    <span className="text-gray-400">
                      ({[...new Set(items.filter(i => !i._esIcbper).map(i => i.porcentajeIGV))].join('% / ')}%)
                    </span>
                  )}
                </span>
                <span className="font-medium text-gray-700">{simbolo} {totales.igv.toFixed(2)}</span>
              </div>
              {totales.totalIcbper > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>ICBPER (Bolsas)</span>
                  <span className="font-medium text-amber-600">{simbolo} {totales.totalIcbper.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-brand-blue pt-3 border-t border-gray-100">
                <span>Total a Pagar</span>
                <span>{simbolo} {totales.importeTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Botón emitir */}
            <button type="button" onClick={emitirComprobante} disabled={emitiendo || sinSucursal}
              className="w-full py-2.5 bg-brand-blue hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-md transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100 hover:shadow-blue-200">
              {emitiendo ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Emitiendo...</>
              ) : (
                <> Emitir {tipo === 'boleta' ? 'Boleta' : 'Factura'}</>
              )}
            </button>

            {errorEmision && (
              <p className="text-[10px] text-red-500 text-center leading-relaxed">{errorEmision}</p>
            )}

            {comprobanteIdEmitido && (
              <div className="relative flex items-center gap-2 p-3 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl shadow-sm">
                <button type="button" onClick={descargarPdf}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-500 hover:text-white active:scale-95 border border-emerald-300 hover:border-emerald-500 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-emerald-200">
                  <Download className="w-4 h-4" /> Descargar PDF
                </button>
                <button type="button" onClick={imprimirPdf}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-700 bg-white hover:bg-sky-500 hover:text-white active:scale-95 border border-sky-300 hover:border-sky-500 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-sky-200">
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
                <button type="button" onClick={() => setComprobanteIdEmitido(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-white hover:bg-red-500 hover:text-white text-gray-400 active:scale-95 border border-gray-200 hover:border-red-500 rounded-full transition-all duration-200 shadow-sm">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Series configuradas 
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚙️</span>
              <h4 className="text-xs font-bold text-gray-500">Series Configuradas</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className={`border rounded-xl p-3 space-y-0.5 transition-colors
                ${tipo === 'boleta' ? 'border-brand-blue bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wide">Boleta</p>
                <p className="text-xs font-mono font-semibold text-gray-700">
                  {sucursal?.serieBoleta ?? '—'}-{String(sucursal?.correlativoBoleta ?? 1).padStart(8, '0')}
                </p>
              </div>
              <div className={`border rounded-xl p-3 space-y-0.5 transition-colors
                ${tipo === 'factura' ? 'border-brand-blue bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wide">Factura</p>
                <p className="text-xs font-mono font-semibold text-gray-700">
                  {sucursal?.serieFactura ?? '—'}-{String(sucursal?.correlativoFactura ?? 1).padStart(8, '0')}
                </p>
              </div>
            </div>
          </div>*/}

          {/* SUNAT badge */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Este comprobante será enviado automáticamente a la <strong>SUNAT</strong> y validado en tiempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
