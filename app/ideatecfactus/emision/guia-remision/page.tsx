"use client";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Printer,
  ShieldCheck,
  ChevronLeft,
  Truck,
  FileText,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoGuia = "remitente" | "transportista";
type ModalidadTraslado = "01" | "02"; // 01 = público, 02 = privado

interface SucursalData {
  serieGuiaRemision: string;
  correlativoGuiaRemision: number;
  serieGuiaTransportista: string;
  correlativoGuiaTransportista: number;
}

interface DireccionCliente {
  direccionId: number;
  direccionLineal: string;
  ubigeo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  tipoDireccion: string;
}

interface Cliente {
  clienteId: number;
  razonSocialNombre: string;
  numeroDocumento: string;
  tipoDocumento: { tipoDocumentoId: string; tipoDocumentoNombre: string };
  direccion: DireccionCliente[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MOTIVOS_TRASLADO = [
  { codigo: "01", label: "Venta" },
  { codigo: "02", label: "Compra" },
  { codigo: "03", label: "Traslado entre establecimientos" },
  { codigo: "04", label: "Consignación" },
  { codigo: "05", label: "Devolución" },
  { codigo: "06", label: "Traslado por emisor itinerante" },
  { codigo: "07", label: "Traslado zona primaria" },
  { codigo: "08", label: "Importación" },
  { codigo: "09", label: "Exportación" },
  { codigo: "13", label: "Otros" },
];

const inputClass =
  "w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all";
const selectClass =
  "w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue";
const labelClass = "text-xs font-bold text-gray-500 uppercase";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function GuiaRemisionPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();

  // — Estado: tipo de guía
  const [tipoGuia, setTipoGuia] = useState<TipoGuia>("remitente");

  // — Estado: datos de la sucursal (series y correlativos)
  const [sucursal, setSucursal] = useState<SucursalData | null>(null);
  const [loadingSucursal, setLoadingSucursal] = useState(true);
  const [errorSucursal, setErrorSucursal] = useState<string | null>(null);

  // — Estado: campos del formulario
  const [modalidad, setModalidad] = useState<ModalidadTraslado>("01");
  const [motivoCodigo, setMotivoCodigo] = useState("01");
  const [motivoOtros, setMotivoOtros] = useState("");

  const [destinatarioQuery, setDestinatarioQuery] = useState("");
  const [destinatarioResultados, setDestinatarioResultados] = useState<
    Cliente[]
  >([]);
  const [destinatarioSeleccionado, setDestinatarioSeleccionado] =
    useState<Cliente | null>(null);
  const [loadingDestinatario, setLoadingDestinatario] = useState(false);

  // ── API 1: Cargar sucursal ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.sucursalID || !accessToken) return;

    const fetchSucursal = async () => {
      setLoadingSucursal(true);
      setErrorSucursal(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${user.sucursalID}`,
          {
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setSucursal({
          serieGuiaRemision: data.serieGuiaRemision,
          correlativoGuiaRemision: data.correlativoGuiaRemision,
          serieGuiaTransportista: data.serieGuiaTransportista,
          correlativoGuiaTransportista: data.correlativoGuiaTransportista,
        });
      } catch (err: any) {
        setErrorSucursal("No se pudo cargar la serie. Intenta recargar.");
        console.error("Error fetching sucursal:", err);
      } finally {
        setLoadingSucursal(false);
      }
    };

    fetchSucursal();
  }, [user?.sucursalID, accessToken]);

  // ── API 2: Buscar destinatario (cliente) ──────────────────────────────────
  useEffect(() => {
    if (
      !destinatarioQuery ||
      destinatarioQuery.length < 2 ||
      !user?.ruc ||
      !accessToken
    ) {
      setDestinatarioResultados([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoadingDestinatario(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Cliente/search/${user.ruc}?q=${encodeURIComponent(destinatarioQuery)}`,
          {
            headers: { accept: "*/*", Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: Cliente[] = await res.json();
        setDestinatarioResultados(data);
      } catch (err) {
        console.error("Error buscando cliente:", err);
        setDestinatarioResultados([]);
      } finally {
        setLoadingDestinatario(false);
      }
    }, 350); // debounce 350ms

    return () => clearTimeout(delay);
  }, [destinatarioQuery, user?.ruc, accessToken]);

  // — Derivados según tipo de guía seleccionado
  const serieActual =
    tipoGuia === "remitente"
      ? sucursal?.serieGuiaRemision
      : sucursal?.serieGuiaTransportista;

  const correlativoActual =
    tipoGuia === "remitente"
      ? sucursal?.correlativoGuiaRemision
      : sucursal?.correlativoGuiaTransportista;

  const correlativoFormateado = correlativoActual
    ? String(correlativoActual).padStart(7, "0")
    : "-------";

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button
          variant="ghost"
          onClick={() => router.push("/ideatecfactus/emision")}
          className="h-10 w-10 p-0 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Nueva Guía de Remisión
          </h3>
          <p className="text-sm text-gray-500">
            Regresar a selección de comprobante
          </p>
        </div>
      </div>

      {/* ── Selector de tipo de guía ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTipoGuia("remitente")}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            tipoGuia === "remitente"
              ? "border-brand-blue bg-brand-blue/5"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              tipoGuia === "remitente" ? "bg-brand-blue/10" : "bg-gray-100"
            }`}
          >
            <FileText
              className={`w-5 h-5 ${
                tipoGuia === "remitente" ? "text-brand-blue" : "text-gray-400"
              }`}
            />
          </div>
          <div>
            <p
              className={`text-sm font-bold ${
                tipoGuia === "remitente" ? "text-brand-blue" : "text-gray-700"
              }`}
            >
              Guía Remitente
            </p>
            <p className="text-xs text-gray-400">
              Serie T — Quien envía los bienes
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTipoGuia("transportista")}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            tipoGuia === "transportista"
              ? "border-brand-blue bg-brand-blue/5"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              tipoGuia === "transportista" ? "bg-brand-blue/10" : "bg-gray-100"
            }`}
          >
            <Truck
              className={`w-5 h-5 ${
                tipoGuia === "transportista"
                  ? "text-brand-blue"
                  : "text-gray-400"
              }`}
            />
          </div>
          <div>
            <p
              className={`text-sm font-bold ${
                tipoGuia === "transportista"
                  ? "text-brand-blue"
                  : "text-gray-700"
              }`}
            >
              Guía Transportista
            </p>
            <p className="text-xs text-gray-400">
              Serie V — Empresa transportista
            </p>
          </div>
        </button>
      </div>

      {/* ── Cuerpo principal ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Datos del Traslado"
            subtitle="Completa la información requerida"
          >
            <form className="space-y-6">
              {/* Serie y número */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Serie y Número</label>
                  <div className="flex gap-2">
                    {/* Serie: deshabilitada, viene de la sucursal */}
                    <div
                      className={`w-1/3 py-2.5 px-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-mono text-sm flex items-center ${
                        loadingSucursal ? "animate-pulse" : ""
                      }`}
                    >
                      {loadingSucursal ? "..." : (serieActual ?? "—")}
                    </div>
                    {/* Correlativo: deshabilitado, autoincremental */}
                    <input
                      type="text"
                      disabled
                      value={
                        loadingSucursal ? "Cargando..." : correlativoFormateado
                      }
                      className="w-2/3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl px-4 text-gray-500 font-mono"
                    />
                  </div>
                  {errorSucursal && (
                    <p className="text-xs text-red-500 mt-1">{errorSucursal}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Fecha de Traslado</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Motivo + Modalidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Motivo de Traslado</label>
                  <select
                    className={selectClass}
                    value={motivoCodigo}
                    onChange={(e) => setMotivoCodigo(e.target.value)}
                  >
                    {MOTIVOS_TRASLADO.map((m) => (
                      <option key={m.codigo} value={m.codigo}>
                        {m.codigo} - {m.label}
                      </option>
                    ))}
                  </select>
                  {/* Campo adicional solo cuando motivo = 13 (Otros) */}
                  {motivoCodigo === "13" && (
                    <input
                      type="text"
                      placeholder="Describa el motivo..."
                      maxLength={200}
                      className={`${inputClass} mt-2`}
                      value={motivoOtros}
                      onChange={(e) => setMotivoOtros(e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Modalidad de Traslado</label>
                  <select
                    className={selectClass}
                    value={modalidad}
                    onChange={(e) =>
                      setModalidad(e.target.value as ModalidadTraslado)
                    }
                  >
                    <option value="01">01 - Transporte público</option>
                    <option value="02">02 - Transporte privado</option>
                  </select>
                </div>
              </div>

              {/* Puntos de partida y llegada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Punto de Partida</label>
                  <input
                    type="text"
                    placeholder="Dirección de origen..."
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Punto de Llegada</label>
                  <input
                    type="text"
                    placeholder="Dirección de destino..."
                    className={inputClass}
                  />
                </div>
              </div>

              {/* ── Sección Transportista (condicional por modalidad) ──────── */}
              {modalidad === "01" ? (
                /* Transporte PÚBLICO: empresa transportista externa */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Transportista (RUC)</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar transportista..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                      />
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {/* Aquí se mostrará el nombre al seleccionar — API 3 */}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>N° de Placa</label>
                    <input
                      type="text"
                      placeholder="Ej. ABC-123"
                      className={inputClass}
                    />
                  </div>
                </div>
              ) : (
                /* Transporte PRIVADO: conductor propio */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>DNI del Conductor</label>
                    <input
                      type="text"
                      placeholder="Ej. 12345678"
                      maxLength={8}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className={labelClass}>Nombre del Conductor</label>
                    <input
                      type="text"
                      placeholder="Apellidos y nombres..."
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>N° de Placa</label>
                    <input
                      type="text"
                      placeholder="Ej. ABC-123"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Destinatario */}
              <div className="space-y-1.5">
                <label className={labelClass}>Destinatario (RUC/DNI)</label>

                {destinatarioSeleccionado ? (
                  /* — Estado: cliente seleccionado — */
                  <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {destinatarioSeleccionado.razonSocialNombre}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {
                          destinatarioSeleccionado.tipoDocumento
                            .tipoDocumentoNombre
                        }
                        : {destinatarioSeleccionado.numeroDocumento}
                        {destinatarioSeleccionado.direccion[0] && (
                          <>
                            {" "}
                            ·{" "}
                            {
                              destinatarioSeleccionado.direccion[0]
                                .direccionLineal
                            }
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDestinatarioSeleccionado(null);
                        setDestinatarioQuery("");
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-4"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  /* — Estado: buscando — */
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nombre, RUC o DNI..."
                      value={destinatarioQuery}
                      onChange={(e) => setDestinatarioQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                    />
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />

                    {/* Dropdown de resultados */}
                    {(destinatarioResultados.length > 0 ||
                      loadingDestinatario) && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {loadingDestinatario ? (
                          <div className="px-4 py-3 text-sm text-gray-400">
                            Buscando...
                          </div>
                        ) : (
                          destinatarioResultados.map((cliente) => (
                            <button
                              key={cliente.clienteId}
                              type="button"
                              onClick={() => {
                                setDestinatarioSeleccionado(cliente);
                                setDestinatarioQuery("");
                                setDestinatarioResultados([]);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                            >
                              <p className="text-sm font-medium text-gray-800">
                                {cliente.razonSocialNombre}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {cliente.tipoDocumento.tipoDocumentoNombre}:{" "}
                                {cliente.numeroDocumento}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bienes a trasladar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Bienes a Trasladar</label>
                  {/* onClick se conectará con el buscador de productos — API 4 */}
                  <Button
                    variant="ghost"
                    className="h-8 text-xs text-brand-blue"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Agregar bien
                  </Button>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">
                          Código
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">
                          Descripción
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-gray-500">
                          Cant.
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-gray-500">
                          Unidad
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500">
                          Peso (kg)
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {/* Fila de ejemplo — se reemplazará con estado dinámico */}
                      <tr className="text-gray-400 italic">
                        <td className="px-4 py-4 text-center" colSpan={6}>
                          Agrega bienes usando el botón superior
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer del formulario */}
              <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => router.push("/emision")}
                >
                  Cancelar
                </Button>
                <div className="space-y-2 text-right">
                  <div className="flex justify-end gap-8 text-sm text-gray-500">
                    <span>Total bultos:</span>
                    <span className="font-medium text-gray-900">0</span>
                  </div>
                  <div className="flex justify-end gap-8 text-lg font-bold text-brand-blue">
                    <span>Peso bruto total:</span>
                    <span>0.00 kg</span>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card
            title="Vista Previa"
            subtitle="Representación gráfica de la guía"
          >
            <div className="aspect-[1/1.4] bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="p-4 rounded-full bg-white shadow-sm">
                <Printer className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Previsualización del PDF
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Se generará automáticamente al emitir
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button className="w-full py-3 text-base">
                Emitir Guía de Remisión
              </Button>
              <Button variant="outline" className="w-full">
                Guardar como Borrador
              </Button>
            </div>
          </Card>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Este comprobante será enviado automáticamente a la{" "}
              <strong>SUNAT</strong> y validado en tiempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
