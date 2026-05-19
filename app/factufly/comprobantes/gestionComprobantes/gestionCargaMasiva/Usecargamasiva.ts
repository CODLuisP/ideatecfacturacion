import { useState, useCallback } from "react";
import { consultaDni } from "@/app/components/apiConsultasJsonPe/consultaDni";
import { consultaRuc } from "@/app/components/apiConsultasJsonPe/consultaRuc";
import { formatoFechaActual } from "@/app/components/ui/formatoFecha";
import { numeroAlertas } from "@/app/components/ui/numeroAlertas";
import axios from "axios";
import { CargaMasivaState, ComprobanteAgrupado, ResultadoCargaMasiva } from "./Cargamasivatypes";
import { parsearExcel, validarFechaEmision, agruparComprobantes, calcularTotales } from "./Cargamasivautils";

// ── Helper cálculo item ────────────────────────────────────────────────────────
function calcItem(item: { precioUnitario: number; cantidad: number; igvPct: number }) {
  const totalVentaItem = parseFloat((item.precioUnitario * item.cantidad).toFixed(2));
  const montoIGV = parseFloat((totalVentaItem - totalVentaItem / (1 + item.igvPct / 100)).toFixed(2));
  const baseIgv = parseFloat((totalVentaItem - montoIGV).toFixed(2));
  return { baseIgv, montoIGV, totalVentaItem, valorVenta: baseIgv };
}

// ── Hook principal ─────────────────────────────────────────────────────────────
export function useCargaMasiva(accessToken: string, empresa: any, user: any) {
  const [state, setState] = useState<CargaMasivaState>({
    fechaEmision: new Date().toISOString().split("T")[0],
    comprobantes: [],
    erroresGlobales: [],
    cargando: false,
    guardando: false,
    progreso: 0,
    resultado: null,
  });

  // ── Actualizar fecha de emisión ─────────────────────────────────────────────
  const setFechaEmision = useCallback((fecha: string) => {
    setState((prev) => ({ ...prev, fechaEmision: fecha }));
  }, []);

  // ── Descargar plantilla ─────────────────────────────────────────────────────
  const descargarPlantilla = useCallback(() => {
    const link = document.createElement("a");
    link.href = "/Plantilla Carga Masiva Comprobantes.xlsx";
    link.download = "Plantilla Carga Masiva Comprobantes.xlsx";
    link.click();
  }, []);

  // ── Consultar API por RUC o DNI ─────────────────────────────────────────────
  const consultarDocumento = useCallback(async (
    comp: ComprobanteAgrupado
  ): Promise<Partial<ComprobanteAgrupado>> => {
    try {
      if (comp.tipoDoc === "01") {
        // DNI → advertencia si no encuentra, pero puede guardar
        const result = await consultaDni(comp.rucDni);
        if (!result) {
          return {
            apiEncontrado: true, // puede guardar
            tieneAdvertencia: true,
            apiError: `DNI ${comp.rucDni} no encontrado en la API. Verifique el número y nombre antes de guardar.`,
            consultandoApi: false,
          };
        }
        return {
          apiEncontrado: true,
          tieneAdvertencia: false,
          apiError: null,
          consultandoApi: false,
          razonSocial: result.nombreCompleto || comp.razonSocial,
          ubigeo: "",
          direccionLineal: "",
          departamento: "",
          provincia: "",
          distrito: "",
        };
      } else {
        // RUC → error bloqueante si no encuentra
        const result = await consultaRuc(comp.rucDni);
        if (!result) {
          return {
            apiEncontrado: false, // bloquea guardado
            tieneAdvertencia: false,
            apiError: `RUC ${comp.rucDni} no encontrado. Corrija el Excel o emita este comprobante desde el módulo de emisión.`,
            consultandoApi: false,
          };
        }
        return {
          apiEncontrado: true,
          tieneAdvertencia: false,
          apiError: null,
          consultandoApi: false,
          razonSocial: result.razonSocial || comp.razonSocial,
          ubigeo: result.ubigeo || "",
          direccionLineal: result.direccionLineal || "",
          departamento: result.departamento || "",
          provincia: result.provincia || "",
          distrito: result.distrito || "",
        };
      }
    } catch {
      return {
        apiEncontrado: false,
        tieneAdvertencia: false,
        apiError: `Error al consultar ${comp.tipoDoc === "01" ? "DNI" : "RUC"} ${comp.rucDni}. Intente nuevamente.`,
        consultandoApi: false,
      };
    }
  }, []);

  // ── Cargar archivo Excel ────────────────────────────────────────────────────
  const cargarExcel = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      cargando: true,
      erroresGlobales: [],
      comprobantes: [],
      resultado: null,
    }));

    try {
      const { filas, fechaEmision, erroresGlobales } = await parsearExcel(file);

      // Errores de parseo → mostrar y detener
      if (erroresGlobales.length > 0) {
        setState((prev) => ({
          ...prev,
          cargando: false,
          erroresGlobales,
          comprobantes: [],
          fechaEmision: fechaEmision || prev.fechaEmision,
        }));
        return;
      }

      const errFecha = validarFechaEmision(fechaEmision);
      if (errFecha) {
        setState((prev) => ({
          ...prev,
          cargando: false,
          erroresGlobales: [errFecha],
          comprobantes: [],
        }));
        return;
      }

      // Agrupar y marcar como consultando
      const agrupados = agruparComprobantes(filas);
      setState((prev) => ({
        ...prev,
        fechaEmision,
        comprobantes: agrupados.map((c) => ({ ...c, consultandoApi: true })),
        erroresGlobales: [],
      }));

      // Consultar API en lotes de 3
      const LOTE = 3;
      const resultado = [...agrupados];

      for (let i = 0; i < resultado.length; i += LOTE) {
        const lote = resultado.slice(i, i + LOTE);
        const respuestas = await Promise.all(lote.map((c) => consultarDocumento(c)));
        respuestas.forEach((resp, j) => {
          Object.assign(resultado[i + j], resp);
        });
        setState((prev) => ({
          ...prev,
          comprobantes: resultado.map((c) => ({ ...c })),
        }));
      }

      setState((prev) => ({ ...prev, cargando: false, comprobantes: resultado }));
    } catch {
      setState((prev) => ({
        ...prev,
        cargando: false,
        erroresGlobales: ["Error al leer el archivo Excel. Verifique el formato."],
      }));
    }
  }, [consultarDocumento]);

  // ── Construir payload para la API ───────────────────────────────────────────
  const construirPayload = useCallback((
    comp: ComprobanteAgrupado,
    fechaEmision: string,
    sucursalActual: any,
    correlativo: number,
  ) => {
    const { gravadas, igv, importeTotal } = calcularTotales(comp);
    const moneda = comp.moneda === "USD" ? "DÓLARES" : "SOLES";

    const serie = comp.tipoComprobante === "03"
      ? sucursalActual?.serieBoleta
      : sucursalActual?.serieFactura;

    const details = comp.items.map((item, idx) => {
      const calc = calcItem(item);
      return {
        item: idx + 1,
        productoId: null,
        codigo: null,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        unidadMedida: item.unidadMedida,
        precioUnitario: parseFloat((item.precioUnitario / (1 + item.igvPct / 100)).toFixed(6)),
        tipoAfectacionIGV: "10",
        porcentajeIGV: item.igvPct,
        baseIgv: calc.baseIgv,
        montoIGV: calc.montoIGV,
        codigoTipoDescuento: "01",
        descuentoUnitario: 0,
        descuentoTotal: 0,
        valorVenta: calc.valorVenta,
        precioVenta: item.precioUnitario,
        totalVentaItem: calc.totalVentaItem,
        icbper: 0,
        factorIcbper: 0,
      };
    });

    return {
      ublVersion: "2.1",
      tipoOperacion: "0101",
      tipoComprobante: comp.tipoComprobante,
      tipoMoneda: comp.moneda,
      fechaEmision: `${fechaEmision}T00:00:00`,
      horaEmision: `${fechaEmision}T00:00:00`,
      fechaVencimiento: fechaEmision,
      tipoPago: "Contado",
      serie,
      correlativo: String(correlativo).padStart(8, "0"),
      company: {
        ...empresa,
        establecimientoAnexo:
          sucursalActual?.codEstablecimiento ?? empresa?.establecimientoAnexo ?? "0000",
      },
      cliente: {
        clienteId: null,
        tipoDocumento: comp.tipoDoc === "06" ? "6" : comp.tipoDoc,
        numeroDocumento: comp.rucDni,
        razonSocial: comp.razonSocial,
        ubigeo: comp.ubigeo || null,
        direccionLineal: comp.direccionLineal || null,
        departamento: comp.departamento || null,
        provincia: comp.provincia || null,
        distrito: comp.distrito || null,
        correo: comp.correo || null,
        enviadoPorCorreo: false,
        whatsApp: comp.whatsapp || null,
        enviadoPorWhatsApp: false,
      },
      details,
      pagos: [{
        medioPago: "Efectivo",
        monto: importeTotal,
        fechaPago: `${fechaEmision}T00:00:00`,
        numeroOperacion: "",
        entidadFinanciera: "",
        observaciones: "",
      }],
      cuotas: [],
      guias: [],
      totalOperacionesGravadas: gravadas,
      totalOperacionesExoneradas: 0,
      totalOperacionesInafectas: 0,
      totalIGV: igv,
      totalIcbper: 0,
      totalImpuestos: igv,
      totalDescuentos: 0,
      subTotal: parseFloat((gravadas + igv).toFixed(2)),
      importeTotal,
      valorVenta: gravadas,
      montoCredito: 0,
      descuentoGlobal: 0,
      codigoTipoDescGlobal: "03",
      usuarioCreacion: user?.id ?? 0,
      enviadoEnResumen: comp.tipoComprobante === "03" ? false : null,
      legends: [{ code: "1000", value: numeroAlertas(importeTotal, moneda) }],
    };
  }, [empresa, user]);

  // ── Guardar carga masiva ────────────────────────────────────────────────────
  const guardarCargaMasiva = useCallback(async (sucursalActual: any) => {
    // Incluir comprobantes válidos Y los que tienen advertencia (DNI no encontrado)
    const validos = state.comprobantes.filter(
      (c) => (c.apiEncontrado === true) && c.errores.length === 0
    );

    if (validos.length === 0) return;

    setState((prev) => ({ ...prev, guardando: true, progreso: 0 }));

    try {
      // Obtener correlativo actualizado de la sucursal antes de enviar
      const resSucursal = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${sucursalActual.sucursalId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const sucursalData = resSucursal.data;

      let correlativoBoleta = sucursalData.correlativoBoleta;
      let correlativoFactura = sucursalData.correlativoFactura;

      const payloads = validos.map((comp) => {
        const correlativo = comp.tipoComprobante === "03"
          ? correlativoBoleta++
          : correlativoFactura++;
        return construirPayload(
          comp,
          state.fechaEmision,
          { ...sucursalActual, ...sucursalData },
          correlativo
        );
      });

      setState((prev) => ({ ...prev, progreso: 10 }));

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Comprobantes/GenerarMasivo`,
        payloads,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setState((prev) => ({
        ...prev,
        guardando: false,
        progreso: 100,
        resultado: res.data as ResultadoCargaMasiva,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        guardando: false,
        erroresGlobales: [
          err?.response?.data?.mensaje ?? "Error al guardar la carga masiva",
        ],
      }));
    }
  }, [state.comprobantes, state.fechaEmision, construirPayload, accessToken]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setState({
      fechaEmision: new Date().toISOString().split("T")[0],
      comprobantes: [],
      erroresGlobales: [],
      cargando: false,
      guardando: false,
      progreso: 0,
      resultado: null,
    });
  }, []);

  // ── Derivados ───────────────────────────────────────────────────────────────
  // Hay errores bloqueantes si algún RUC no se encontró (apiEncontrado=false y no advertencia)
  const hayErrores = state.comprobantes.some(
    (c) => c.apiEncontrado === false && !c.tieneAdvertencia
  );
  const todosConsultados =
    state.comprobantes.length > 0 &&
    state.comprobantes.every((c) => !c.consultandoApi);
  const puedeGuardar =
    todosConsultados &&
    !hayErrores &&
    state.comprobantes.length > 0 &&
    !state.guardando;

  return {
    state,
    setFechaEmision,
    descargarPlantilla,
    cargarExcel,
    guardarCargaMasiva,
    reset,
    hayErrores,
    todosConsultados,
    puedeGuardar,
    calcularTotales,
  };
}