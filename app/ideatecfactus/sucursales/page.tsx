"use client";
import React, { useState } from 'react';
import {
  Search, Plus, Edit2, Trash2, LayoutList, ChevronDown,
  AlertTriangle, X, Loader2, Eye, EyeOff, Building2,
  Phone, Mail, User, Lock, FileText
} from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Sucursal {
  id: string;
  codigo: string;
  nombre: string;
  telefono: string;
  email: string;
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
  telefono: string;
  email: string;
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
  telefono: string;
  email: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_SUCURSALES: Sucursal[] = [
  {
    id: '1', codigo: '0000', nombre: 'Principal', telefono: 'S/N', email: 'S/N',
    usuario: 'admin',
    serieFactura: 'F001', correlativoFactura: 1,
    serieBoleta: 'B001', correlativoBoleta: 1,
    serieNotaCredito: 'FC01', correlativoNotaCredito: 1,
    serieNotaDebito: 'FD01', correlativoNotaDebito: 1,
    serieGuia: 'T001', correlativoGuia: 1,
  },
  {
    id: '2', codigo: '0001', nombre: 'Santa Anita', telefono: 'S/N', email: 'S/N',
    usuario: 'santa_anita',
    serieFactura: 'F002', correlativoFactura: 1,
    serieBoleta: 'B002', correlativoBoleta: 1,
    serieNotaCredito: 'FC02', correlativoNotaCredito: 1,
    serieNotaDebito: 'FD02', correlativoNotaDebito: 1,
    serieGuia: 'T002', correlativoGuia: 1,
  },
  {
    id: '3', codigo: '0002', nombre: 'Tienda Miraflores', telefono: 'S/N', email: 'S/N',
    usuario: 'miraflores',
    serieFactura: 'F003', correlativoFactura: 1,
    serieBoleta: 'B003', correlativoBoleta: 1,
    serieNotaCredito: 'FC03', correlativoNotaCredito: 1,
    serieNotaDebito: 'FD03', correlativoNotaDebito: 1,
    serieGuia: 'T003', correlativoGuia: 1,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nextCodigo(sucursales: Sucursal[]): string {
  const nums = sucursales.map((s) => parseInt(s.codigo));
  const max = nums.length ? Math.max(...nums) : -1;
  return String(max + 1).padStart(4, '0');
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
      {children}
      {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

function FormInput({
  label, required, hint, icon: Icon, type = 'text', ...props
}: {
  label: string; required?: boolean; hint?: string;
  icon?: React.ElementType; type?: string;
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
          className={`w-full py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white transition-colors ${Icon ? 'pl-9 pr-4' : 'px-4'}`}
          {...props}
        />
      </div>
      {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
    </div>
  );
}

function SerieRowModal({
  label, serieKey, correlativoKey, form, setForm, prefix, hint,
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
          onChange={(e) => setForm((f) => ({ ...f, [serieKey]: e.target.value }))}
          placeholder={hint}
          maxLength={4}
        />
        <p className="text-[10px] text-gray-400 italic">Empieza con "{prefix}" — máx. 4 chars</p>
      </div>
      <div className="w-32 space-y-1.5">
        <FieldLabel>Correlativo</FieldLabel>
        <input
          type="number"
          min={1}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white transition-colors"
          value={form[correlativoKey] as number}
          onChange={(e) =>
            setForm((f) => ({ ...f, [correlativoKey]: Math.max(1, parseInt(e.target.value) || 1) }))
          }
        />
      </div>
    </div>
  );
}

// ─── Modal: Nueva Sucursal ────────────────────────────────────────────────────
function NuevaSucursalModal({
  onClose, onSave, nextCode,
}: {
  onClose: () => void;
  onSave: (form: NuevaSucursalForm) => void;
  nextCode: string;
}) {
  const [step, setStep] = useState<'warn' | 'form'>('warn');
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState<NuevaSucursalForm>({
    nombre: '', telefono: '', email: '', usuario: '', password: '', confirmPassword: '',
    serieFactura: `F${nextCode}`, correlativoFactura: 1,
    serieBoleta: `B${nextCode}`, correlativoBoleta: 1,
    serieNotaCredito: `FC${nextCode.slice(-2)}`, correlativoNotaCredito: 1,
    serieNotaDebito: `FD${nextCode.slice(-2)}`, correlativoNotaDebito: 1,
    serieGuia: `T${nextCode}`, correlativoGuia: 1,
  });

  const upd = (k: keyof NuevaSucursalForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.usuario || !form.password) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    if (form.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {step === 'warn' ? 'Nueva Sucursal' : `Nueva Sucursal — Código ${nextCode}`}
              </p>
              <p className="text-xs text-gray-500">
                {step === 'warn' ? 'Información importante' : 'Completa los datos de la sucursal'}
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
        {step === 'warn' && (
          <div className="p-6 flex flex-col gap-6">
            <div className="flex gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-amber-800">¿Estás seguro de crear una nueva sucursal?</p>
                <p className="text-sm text-amber-700">Al crear una nueva sucursal debes tener en cuenta lo siguiente:</p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>Se asignará el código <strong>{nextCode}</strong> a esta sucursal.</li>
                  <li>Se crearán <strong>nuevas series y correlativos</strong> de comprobantes de pago independientes.</li>
                  <li>Deberás crear un <strong>usuario y contraseña</strong> exclusivos para esta sucursal.</li>
                  <li>Esta acción no puede deshacerse fácilmente una vez guardada.</li>
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
                onClick={() => setStep('form')}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                Entendido, continuar
              </button>
            </div>
          </div>
        )}

        {/* ── Formulario ── */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 p-6 space-y-6">

              {/* Datos generales */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-gray-800">Datos de la Sucursal</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Nombre" required icon={Building2} value={form.nombre} onChange={upd('nombre')} placeholder="Ej: Tienda San Isidro" />
                  <FormInput label="Teléfono" icon={Phone} value={form.telefono} onChange={upd('telefono')} placeholder="Ej: 01 234 5678" type="tel" />
                  <div className="sm:col-span-2">
                    <FormInput label="Email" icon={Mail} value={form.email} onChange={upd('email')} placeholder="sucursal@empresa.pe" type="email" />
                  </div>
                </div>
              </div>

              {/* Usuario */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
                  <User className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-gray-800">Acceso a la Sucursal</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Usuario" required icon={User} value={form.usuario} onChange={upd('usuario')} placeholder="Ej: san_isidro" hint="Sin espacios ni caracteres especiales" />

                  {/* Password con ojo */}
                  <div className="space-y-1.5">
                    <FieldLabel required>Contraseña</FieldLabel>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={form.password}
                        onChange={upd('password')}
                        placeholder="Mín. 6 caracteres"
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white transition-colors"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
                    <FieldLabel required>Confirmar Contraseña</FieldLabel>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={form.confirmPassword}
                        onChange={upd('confirmPassword')}
                        placeholder="Repite la contraseña"
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl outline-none text-sm focus:border-blue-500 bg-white transition-colors"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Series */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-gray-800">Series de Comprobantes</p>
                  <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Generadas automáticamente</span>
                </div>
                <div className="space-y-4">
                  <SerieRowModal label="Factura"         serieKey="serieFactura"     correlativoKey="correlativoFactura"     form={form} setForm={setForm} prefix="F" hint={`F${nextCode}`} />
                  <SerieRowModal label="Boleta"          serieKey="serieBoleta"      correlativoKey="correlativoBoleta"      form={form} setForm={setForm} prefix="B" hint={`B${nextCode}`} />
                  <SerieRowModal label="Nota de Crédito" serieKey="serieNotaCredito" correlativoKey="correlativoNotaCredito" form={form} setForm={setForm} prefix="F" hint="FC01" />
                  <SerieRowModal label="Nota de Débito"  serieKey="serieNotaDebito"  correlativoKey="correlativoNotaDebito"  form={form} setForm={setForm} prefix="F" hint="FD01" />
                  <SerieRowModal label="Guía de Remisión" serieKey="serieGuia"       correlativoKey="correlativoGuia"       form={form} setForm={setForm} prefix="T" hint={`T${nextCode}`} />
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
                {saving ? 'Guardando...' : 'Crear Sucursal'}
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
  sucursal, onClose, onSave,
}: {
  sucursal: Sucursal;
  onClose: () => void;
  onSave: (id: string, data: EditSucursalForm) => void;
}) {
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [form, setForm] = useState<EditSucursalForm>({
    nombre: sucursal.nombre === 'S/N' ? '' : sucursal.nombre,
    telefono: sucursal.telefono === 'S/N' ? '' : sucursal.telefono,
    email: sucursal.email === 'S/N' ? '' : sucursal.email,
  });

  const upd = (k: keyof EditSucursalForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre) { showToast('El nombre es obligatorio', 'error'); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    onSave(sucursal.id, form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
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
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <FormInput label="Nombre" required icon={Building2} value={form.nombre} onChange={upd('nombre')} placeholder="Nombre de la sucursal" />
            <FormInput label="Teléfono" icon={Phone} value={form.telefono} onChange={upd('telefono')} placeholder="Ej: 01 234 5678" type="tel" />
            <FormInput label="Email" icon={Mail} value={form.email} onChange={upd('email')} placeholder="sucursal@empresa.pe" type="email" />
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Series de Sucursal ────────────────────────────────────────────────
function SeriesSucursalModal({
  sucursal, onClose,
}: {
  sucursal: Sucursal;
  onClose: () => void;
}) {
  const rows = [
    { label: 'Factura',          serie: sucursal.serieFactura,     corr: sucursal.correlativoFactura },
    { label: 'Boleta',           serie: sucursal.serieBoleta,      corr: sucursal.correlativoBoleta },
    { label: 'Nota de Crédito',  serie: sucursal.serieNotaCredito, corr: sucursal.correlativoNotaCredito },
    { label: 'Nota de Débito',   serie: sucursal.serieNotaDebito,  corr: sucursal.correlativoNotaDebito },
    { label: 'Guía de Remisión', serie: sucursal.serieGuia,        corr: sucursal.correlativoGuia },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-50 border border-green-100">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Series — {sucursal.nombre}</p>
              <p className="text-xs text-gray-500">Código: {sucursal.codigo}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Documento</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Serie</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Correlativo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-gray-700 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        {row.serie}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 font-mono">{String(row.corr).padStart(8, '0')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Confirmar Eliminar ────────────────────────────────────────────────
function EliminarModal({
  sucursal, onClose, onConfirm,
}: {
  sucursal: Sucursal;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 700));
    onConfirm(sucursal.id);
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
              <Trash2 className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">Eliminar Sucursal</p>
          </div>
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la sucursal{' '}
            <strong className="text-gray-900">"{sucursal.nombre}"</strong>{' '}
            (Código {sucursal.codigo})? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-60 rounded-xl transition-colors">
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SucursalesPage() {
  const { showToast } = useToast();
  const [sucursales, setSucursales] = useState<Sucursal[]>(INITIAL_SUCURSALES);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const [modalNueva, setModalNueva] = useState(false);
  const [modalEditar, setModalEditar] = useState<Sucursal | null>(null);
  const [modalSeries, setModalSeries] = useState<Sucursal | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Sucursal | null>(null);

  const filtered = sucursales.filter(
    (s) =>
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.codigo.includes(search) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );
  const displayed = filtered.slice(0, pageSize);

  const handleCrear = (form: NuevaSucursalForm) => {
    const code = nextCodigo(sucursales);
    const nueva: Sucursal = {
      id: Date.now().toString(),
      codigo: code,
      nombre: form.nombre,
      telefono: form.telefono || 'S/N',
      email: form.email || 'S/N',
      usuario: form.usuario,
      serieFactura: form.serieFactura,
      correlativoFactura: form.correlativoFactura,
      serieBoleta: form.serieBoleta,
      correlativoBoleta: form.correlativoBoleta,
      serieNotaCredito: form.serieNotaCredito,
      correlativoNotaCredito: form.correlativoNotaCredito,
      serieNotaDebito: form.serieNotaDebito,
      correlativoNotaDebito: form.correlativoNotaDebito,
      serieGuia: form.serieGuia,
      correlativoGuia: form.correlativoGuia,
    };
    setSucursales((prev) => [...prev, nueva]);
    setModalNueva(false);
    showToast(`Sucursal "${form.nombre}" creada correctamente`, 'success');
  };

  const handleEditar = (id: string, data: EditSucursalForm) => {
    setSucursales((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, nombre: data.nombre, telefono: data.telefono || 'S/N', email: data.email || 'S/N' }
          : s,
      ),
    );
    setModalEditar(null);
    showToast('Sucursal actualizada correctamente', 'success');
  };

  const handleEliminar = (id: string) => {
    const s = sucursales.find((x) => x.id === id);
    setSucursales((prev) => prev.filter((x) => x.id !== id));
    setModalEliminar(null);
    showToast(`Sucursal "${s?.nombre}" eliminada`, 'error');
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
                  <option key={n} value={n}>{n}</option>
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
                {['CÓDIGO', 'NOMBRE', 'TELÉFONO', 'EMAIL', 'ACCIONES'].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === 'ACCIONES' ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    No se encontraron sucursales
                  </td>
                </tr>
              ) : (
                displayed.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-blue-50/30 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-mono font-bold border border-gray-200">
                        {s.codigo}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-800 font-medium">{s.nombre}</td>
                    <td className="px-5 py-4 text-gray-500">{s.telefono}</td>
                    <td className="px-5 py-4 text-gray-500">{s.email}</td>
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
                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => setModalEliminar(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 rounded-lg transition-all shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
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
            Mostrando <strong>{displayed.length}</strong> de <strong>{filtered.length}</strong> resultado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Modals */}
      {modalNueva && (
        <NuevaSucursalModal
          nextCode={nextCodigo(sucursales)}
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