"use client";
import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  LayoutList,
  ChevronDown,
  AlertTriangle,
  X,
  Loader2,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Mail,
  User,
  Lock,
  FileText,
} from "lucide-react";
import { useToast } from "@/app/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Sucursal {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  usuario: string;
  // series
  serieFactura: string;
  correlativoFactura: number;
  serieBoleta: string;
  correlativoBoleta: number;
  serieNotaCredito: string;
  correlativoNotaCredito: number;
  serieNotaDebito: string;
  correlativoNotaDebito: number;
  serieGuia: string;
  correlativoGuia: number;
}

interface NuevaSucursalForm {
  nombre: string;
  direccion: string;
  usuario: string;
  password: string;
  confirmPassword: string;
  serieFactura: string;
  correlativoFactura: number;
  serieBoleta: string;
  correlativoBoleta: number;
  serieNotaCredito: string;
  correlativoNotaCredito: number;
  serieNotaDebito: string;
  correlativoNotaDebito: number;
  serieGuia: string;
  correlativoGuia: number;
}

interface EditSucursalForm {
  nombre: string;
  direccion: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nextCodigo(sucursales: Sucursal[]): string {
  const nums = sucursales.map((s) => parseInt(s.codigo));
  const max = nums.length ? Math.max(...nums) : -1;
  return String(max + 1).padStart(4, "0");
}

function nextSerie(
  sucursales: Sucursal[],
  prefix: string,
  key: keyof Sucursal,
): string {
  const nums = sucursales
    .map((s) => {
      const val = s[key] as string;
      return val ? parseInt(val.replace(prefix, "")) : 0;
    })
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  const padLength = 4 - prefix.length; // ← dinámico
  return `${prefix}${String(max + 1).padStart(padLength, "0")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
      {children}
      {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

function FormInput({
  label,
  required,
  hint,
  icon: Icon,
  type = "text",
  ...props
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ElementType;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        )}
        <input
          type={type}
          required={required}
          className={`w-full py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white transition-colors ${Icon ? "pl-9 pr-4" : "px-4"}`}
          {...props}
        />
      </div>
      {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
    </div>
  );
}

function SerieRowModal({
  label,
  serieKey,
  correlativoKey,
  form,
  setForm,
  prefix,
  hint,
}: {
  label: string;
  serieKey: keyof NuevaSucursalForm;
  correlativoKey: keyof NuevaSucursalForm;
  form: NuevaSucursalForm;
  setForm: React.Dispatch<React.SetStateAction<NuevaSucursalForm>>;
  prefix: string;
  hint: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1 space-y-1.5">
        <FieldLabel>{label} — Serie</FieldLabel>
        <input
          className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white transition-colors"
          value={form[serieKey] as string}
          onChange={(e) =>
            setForm((f) => ({ ...f, [serieKey]: e.target.value }))
          }
          placeholder={hint}
          maxLength={4}
        />
        <p className="text-[10px] text-gray-400 italic">
          Empieza con "{prefix}" — máx. 4 chars
        </p>
      </div>
      <div className="w-32 space-y-1.5">
        <FieldLabel>Correlativo</FieldLabel>
        <input
          type="number"
          min={1}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white transition-colors"
          value={form[correlativoKey] as number}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              [correlativoKey]: Math.max(1, parseInt(e.target.value) || 1),
            }))
          }
        />
      </div>
    </div>
  );
}

// ─── Modal: Nueva Sucursal ────────────────────────────────────────────────────
function NuevaSucursalModal({
  onClose,
  onSave,
  nextCode,
  sucursales,
}: {
  onClose: () => void;
  onSave: (form: NuevaSucursalForm) => Promise<void>;
  nextCode: string;
  sucursales: Sucursal[];
}) {
  const [step, setStep] = useState<"warn" | "form">("warn");
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState<NuevaSucursalForm>({
    nombre: "",
    direccion: "",
    usuario: "",
    password: "",
    confirmPassword: "",
    serieFactura: nextSerie(sucursales, "F", "serieFactura"),
    correlativoFactura: 1,
    serieBoleta: nextSerie(sucursales, "B", "serieBoleta"),
    correlativoBoleta: 1,
    serieNotaCredito: nextSerie(sucursales, "FC", "serieNotaCredito"),
    correlativoNotaCredito: 1,
    serieNotaDebito: nextSerie(sucursales, "FD", "serieNotaDebito"),
    correlativoNotaDebito: 1,
    serieGuia: nextSerie(sucursales, "T", "serieGuia"),
    correlativoGuia: 1,
  });

  const upd =
    (k: keyof NuevaSucursalForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.usuario || !form.password) {
      showToast("Completa los campos obligatorios", "error");
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }
    if (form.password.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }
    setSaving(true);
    try {
      await onSave(form); // ← espera el resultado
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Nueva Sucursal</p>
              <p className="text-xs text-gray-500">
                {step === "warn"
                  ? "Información importante"
                  : "Completa los datos de la sucursal"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Advertencia ── */}
        {step === "warn" && (
          <div className="p-6 flex flex-col gap-6">
            <div className="flex gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-amber-800">
                  ¿Estás seguro de crear una nueva sucursal?
                </p>
                <p className="text-sm text-amber-700">
                  Al crear una nueva sucursal debes tener en cuenta lo
                  siguiente:
                </p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>
                    Se asignará el código <strong>{nextCode}</strong> a esta
                    sucursal.
                  </li>
                  <li>
                    Se crearán <strong>nuevas series y correlativos</strong> de
                    comprobantes de pago independientes.
                  </li>
                  <li>
                    Deberás crear un <strong>usuario y contraseña</strong>{" "}
                    exclusivos para esta sucursal.
                  </li>
                  <li>
                    Esta acción no puede deshacerse fácilmente una vez guardada.
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                Entendido, continuar
              </button>
            </div>
          </div>
        )}

        {/* ── Formulario ── */}
        {step === "form" && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Datos generales */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-gray-800">
                    Datos de la Sucursal
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Nombre"
                    required
                    icon={Building2}
                    value={form.nombre}
                    onChange={upd("nombre")}
                    placeholder="Ej: Tienda San Isidro"
                  />

                  <FormInput
                    label="Dirección"
                    icon={Building2}
                    value={form.direccion}
                    onChange={upd("direccion")}
                    placeholder="Ej: Av. Principal 123"
                  />
                </div>
              </div>

              {/* Usuario */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
                  <User className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-gray-800">
                    Acceso a la Sucursal
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Usuario"
                    required
                    icon={User}
                    value={form.usuario}
                    onChange={upd("usuario")}
                    placeholder="Ej: san_isidro"
                    hint="Sin espacios ni caracteres especiales"
                  />

                  {/* Password con ojo */}
                  <div className="space-y-1.5">
                    <FieldLabel required>Contraseña</FieldLabel>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={form.password}
                        onChange={upd("password")}
                        placeholder="Mín. 6 caracteres"
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
                    <FieldLabel required>Confirmar Contraseña</FieldLabel>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={form.confirmPassword}
                        onChange={upd("confirmPassword")}
                        placeholder="Repite la contraseña"
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Series */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-gray-800">
                    Series de Comprobantes
                  </p>
                  <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Generadas automáticamente
                  </span>
                </div>
                <div className="space-y-4">
                  <SerieRowModal
                    label="Factura"
                    serieKey="serieFactura"
                    correlativoKey="correlativoFactura"
                    form={form}
                    setForm={setForm}
                    prefix="F"
                    hint={`F${nextCode}`}
                  />
                  <SerieRowModal
                    label="Boleta"
                    serieKey="serieBoleta"
                    correlativoKey="correlativoBoleta"
                    form={form}
                    setForm={setForm}
                    prefix="B"
                    hint={`B${nextCode}`}
                  />
                  <SerieRowModal
                    label="Nota de Crédito"
                    serieKey="serieNotaCredito"
                    correlativoKey="correlativoNotaCredito"
                    form={form}
                    setForm={setForm}
                    prefix="F"
                    hint="FC01"
                  />
                  <SerieRowModal
                    label="Nota de Débito"
                    serieKey="serieNotaDebito"
                    correlativoKey="correlativoNotaDebito"
                    form={form}
                    setForm={setForm}
                    prefix="F"
                    hint="FD01"
                  />
                  <SerieRowModal
                    label="Guía de Remisión"
                    serieKey="serieGuia"
                    correlativoKey="correlativoGuia"
                    form={form}
                    setForm={setForm}
                    prefix="T"
                    hint={`T${nextCode}`}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Guardando..." : "Crear Sucursal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Modal: Editar Sucursal ───────────────────────────────────────────────────
function EditarSucursalModal({
  sucursal,
  onClose,
  onSave,
}: {
  sucursal: Sucursal;
  onClose: () => void;
  onSave: (id: string, data: EditSucursalForm) => void;
}) {
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [form, setForm] = useState<EditSucursalForm>({
    nombre: sucursal.nombre === "S/N" ? "" : sucursal.nombre,
    direccion: sucursal.direccion ?? "",
  });

  const upd =
    (k: keyof EditSucursalForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre) {
      showToast("El nombre es obligatorio", "error");
      return;
    }
    setSaving(true);
    try {
      await onSave(sucursal.id, form);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
              <Edit2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Editar Sucursal</p>
              <p className="text-xs text-gray-500">Código: {sucursal.codigo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <FormInput
              label="Nombre"
              required
              icon={Building2}
              value={form.nombre}
              onChange={upd("nombre")}
              placeholder="Nombre de la sucursal"
            />
            <FormInput
              label="Dirección"
              icon={Building2}
              value={form.direccion}
              onChange={upd("direccion")}
              placeholder="Ej: Av. Principal 123"
            />
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Series de Sucursal ────────────────────────────────────────────────
function SeriesSucursalModal({
  sucursal,
  onClose,
  onSave,
}: {
  sucursal: Sucursal;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [form, setForm] = useState({
    serieFactura: sucursal.serieFactura,
    correlativoFactura: sucursal.correlativoFactura,
    serieBoleta: sucursal.serieBoleta,
    correlativoBoleta: sucursal.correlativoBoleta,
    serieNotaCredito: sucursal.serieNotaCredito,
    correlativoNotaCredito: sucursal.correlativoNotaCredito,
    serieNotaDebito: sucursal.serieNotaDebito,
    correlativoNotaDebito: sucursal.correlativoNotaDebito,
    serieGuiaRemision: sucursal.serieGuia,
    correlativoGuiaRemision: sucursal.correlativoGuia,
    serieGuiaTransportista: "V001",
    correlativoGuiaTransportista: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(sucursal.id, form);
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    {
      label: "Factura",
      serieKey: "serieFactura",
      corrKey: "correlativoFactura",
    },
    { label: "Boleta", serieKey: "serieBoleta", corrKey: "correlativoBoleta" },
    {
      label: "Nota de Crédito",
      serieKey: "serieNotaCredito",
      corrKey: "correlativoNotaCredito",
    },
    {
      label: "Nota de Débito",
      serieKey: "serieNotaDebito",
      corrKey: "correlativoNotaDebito",
    },
    {
      label: "Guía de Remisión",
      serieKey: "serieGuiaRemision",
      corrKey: "correlativoGuiaRemision",
    },
    {
      label: "Guía Transportista",
      serieKey: "serieGuiaTransportista",
      corrKey: "correlativoGuiaTransportista",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-50 border border-green-100">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Series — {sucursal.nombre}
              </p>
              <p className="text-xs text-gray-500">Código: {sucursal.codigo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Documento
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Serie
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Correlativo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {row.label}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                          {(form as any)[row.serieKey]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={1}
                          className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-xs text-center font-mono text-gray-600 outline-none focus:border-blue-400"
                          value={(form as any)[row.corrKey]}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              [row.corrKey]: Math.max(
                                1,
                                parseInt(e.target.value) || 1,
                              ),
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Guardando..." : "Guardar Series"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Confirmar Eliminar ────────────────────────────────────────────────
function EliminarModal({
  sucursal,
  onClose,
  onConfirm,
}: {
  sucursal: Sucursal;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>; // ← Promise<void>
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(sucursal.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
              <Trash2 className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">Eliminar Sucursal</p>
          </div>
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la sucursal{" "}
            <strong className="text-gray-900">"{sucursal.nombre}"</strong>{" "}
            (Código {sucursal.codigo})? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-60 rounded-xl transition-colors"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SucursalesPage() {
  const { showToast } = useToast();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const [modalNueva, setModalNueva] = useState(false);
  const [modalEditar, setModalEditar] = useState<Sucursal | null>(null);
  const [modalSeries, setModalSeries] = useState<Sucursal | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Sucursal | null>(null);

  const { accessToken, user } = useAuth();
  const [loading, setLoading] = useState(true);

  const filtered = sucursales.filter(
    (s) =>
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.codigo.includes(search),
  );
  const displayed = filtered.slice(0, pageSize);

  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = res.data.map((s: any) => ({
        id: s.sucursalId.toString(),
        codigo: s.codEstablecimiento,
        nombre: s.nombre ?? s.codEstablecimiento,
        direccion: s.direccion ?? "",
        usuario: "",
        serieFactura: s.serieFactura,
        correlativoFactura: s.correlativoFactura ?? 1,
        serieBoleta: s.serieBoleta,
        correlativoBoleta: s.correlativoBoleta ?? 1,
        serieNotaCredito: s.serieNotaCredito,
        correlativoNotaCredito: s.correlativoNotaCredito ?? 1,
        serieNotaDebito: s.serieNotaDebito,
        correlativoNotaDebito: s.correlativoNotaDebito ?? 1,
        serieGuia: s.serieGuiaRemision,
        correlativoGuia: s.correlativoGuiaRemision ?? 1,
      }));
      setSucursales(data);
    } catch {
      showToast("Error al cargar sucursales", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchSucursales();
  }, [accessToken]);

  const handleCrear = async (form: NuevaSucursalForm) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal`,
        {
          codEstablecimiento: nextCodigo(sucursales),
          nombre: form.nombre,
          direccion: form.direccion,
          nombreSucursal: form.nombre,
          serieFactura: form.serieFactura,
          correlativoFactura: form.correlativoFactura,
          serieBoleta: form.serieBoleta,
          correlativoBoleta: form.correlativoBoleta,
          serieNotaCredito: form.serieNotaCredito,
          correlativoNotaCredito: form.correlativoNotaCredito,
          serieNotaDebito: form.serieNotaDebito,
          correlativoNotaDebito: form.correlativoNotaDebito,
          serieGuiaRemision: form.serieGuia,
          correlativoGuiaRemision: form.correlativoGuia,
          serieGuiaTransportista: "V001",
          correlativoGuiaTransportista: 1,
          usernameAdminSucursal: form.usuario,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalNueva(false);
      showToast(`Sucursal "${form.nombre}" creada correctamente`, "success");
      fetchSucursales();
    } catch (error: any) {
      showToast(
        error.response?.data?.mensaje || "Error al crear sucursal",
        "error",
      );
    }
  };

  const handleEditarSeries = async (id: string, data: any) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${id}`,
        {
          ...data,
          sucursalId: parseInt(id),
          nombre: modalSeries?.nombre, // ← agregar
          direccion: modalSeries?.direccion,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalSeries(null);
      showToast("Series actualizadas correctamente", "success");
      fetchSucursales();
    } catch (error: any) {
      showToast(
        error.response?.data?.mensaje || "Error al actualizar series",
        "error",
      );
    }
  };

  const handleEditar = async (id: string, data: EditSucursalForm) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${id}`,
        { nombre: data.nombre, direccion: data.direccion },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalEditar(null);
      showToast("Sucursal actualizada correctamente", "success");
      fetchSucursales();
    } catch (error: any) {
      showToast(
        error.response?.data?.mensaje || "Error al actualizar sucursal",
        "error",
      );
    }
  };

  const handleEliminar = async (id: string) => {
    const s = sucursales.find((x) => x.id === id);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Sucursal/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setModalEliminar(null);
      showToast(`Sucursal "${s?.nombre}" eliminada`, "error");
      fetchSucursales();
    } catch (error: any) {
      showToast(
        error.response?.data?.mensaje || "Error al eliminar sucursal",
        "error",
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest mb-1">
            Dashboard / Sucursales
          </p>
          <h1 className="text-xl font-bold text-gray-900">Sucursales</h1>
        </div>
        <button
          type="button"
          onClick={() => setModalNueva(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-sm shadow-blue-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-gray-50 transition-colors placeholder:text-gray-400"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Columnas (decorativo) */}
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <LayoutList className="w-4 h-4" />
              Columnas
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Paginación */}
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white transition-colors text-gray-700 cursor-pointer"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["CÓDIGO", "NOMBRE", "DIRECCIÓN", "ACCIONES"].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === "ACCIONES" ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-gray-400 text-sm"
                  >
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-gray-400 text-sm"
                  >
                    No se encontraron sucursales
                  </td>
                </tr>
              ) : (
                displayed.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-blue-50/30 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-mono font-bold border border-gray-200">
                        {s.codigo}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-800 font-medium">
                      {s.nombre}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">
                      {s.direccion || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => setModalEditar(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 rounded-lg transition-all shadow-sm"
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>
                        {/* Series */}
                        <button
                          type="button"
                          onClick={() => setModalSeries(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-lg transition-all shadow-sm"
                        >
                          <FileText className="w-3 h-3" />
                          Series
                        </button>
                        {user?.rol === "superadmin" && (
                          <button
                            type="button"
                            onClick={() => setModalEliminar(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 rounded-lg transition-all shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            Mostrando <strong>{displayed.length}</strong> de{" "}
            <strong>{filtered.length}</strong> resultado
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Modals */}
      {modalNueva && (
        <NuevaSucursalModal
          nextCode={nextCodigo(sucursales)}
          sucursales={sucursales}
          onClose={() => setModalNueva(false)}
          onSave={handleCrear}
        />
      )}
      {modalEditar && (
        <EditarSucursalModal
          sucursal={modalEditar}
          onClose={() => setModalEditar(null)}
          onSave={handleEditar}
        />
      )}
      {modalSeries && (
        <SeriesSucursalModal
          sucursal={modalSeries}
          onClose={() => setModalSeries(null)}
          onSave={handleEditarSeries}
        />
      )}
      {modalEliminar && (
        <EliminarModal
          sucursal={modalEliminar}
          onClose={() => setModalEliminar(null)}
          onConfirm={handleEliminar}
        />
      )}
    </div>
  );
}
