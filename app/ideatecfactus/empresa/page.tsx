"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Building2, MapPin, Phone, Upload, X, ChevronDown, Loader2, Store, Hash, Lock } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/app/components/ui/Toast';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';
import { useAuth } from "@/context/AuthContext";

const BASE_URL = 'http://localhost:5004';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmpresaForm {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  ubigeo: string;
  telefono: string;
  email: string;
}

interface Sucursal {
  sucursalId: number;
  empresaRuc: string;
  codEstablecimiento: string;
  nombre: string;
  direccion: string;
  serieFactura: string;
  correlativoFactura: number;
  serieBoleta: string;
  correlativoBoleta: number;
  serieNotaCredito: string;
  correlativoNotaCredito: number;
  serieNotaDebito: string;
  correlativoNotaDebito: number;
  serieGuiaRemision: string;
  correlativoGuiaRemision: number;
  serieGuiaTransportista: string;
  correlativoGuiaTransportista: number;
  estado: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const DEPARTAMENTOS = [
  'AMAZONAS','ÁNCASH','APURÍMAC','AREQUIPA','AYACUCHO','CAJAMARCA','CALLAO',
  'CUSCO','HUANCAVELICA','HUÁNUCO','ICA','JUNÍN','LA LIBERTAD','LAMBAYEQUE',
  'LIMA','LORETO','MADRE DE DIOS','MOQUEGUA','PASCO','PIURA','PUNO',
  'SAN MARTÍN','TACNA','TUMBES','UCAYALI',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDataUrl(base64: string): string {
  if (!base64) return '';
  if (base64.startsWith('data:')) return base64;
  return `data:image/jpeg;base64,${base64}`;
}

function stripDataUrlPrefix(dataUrl: string): string {
  if (!dataUrl) return '';
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
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

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  hint?: string;
}
function Input({ label, required, hint, disabled, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        required={required}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-2.5 border rounded-xl outline-none text-sm transition-colors',
          disabled
            ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed select-none'
            : 'bg-white border-gray-200 focus:border-brand-blue',
          className
        )}
        {...props}
      />
      {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  hint?: string;
  options: { value: string; label: string }[];
}
function Select({ label, required, hint, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          required={required}
          className={cn(
            'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-blue text-sm appearance-none transition-colors',
            props.disabled
              ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
              : '',
            className
          )}
          {...props}
        >
          <option value="">— Seleccionar —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
      <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
        <Icon className="w-4 h-4 text-brand-blue" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Read-only Banner ─────────────────────────────────────────────────────────
function ReadOnlyBanner() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-6">
      <Lock className="w-4 h-4 text-amber-500 shrink-0" />
      <p className="text-xs text-amber-700 font-medium">
        Estás en modo de solo lectura. Contacta a un administrador para modificar esta información.
      </p>
    </div>
  );
}

// ─── Logo Uploader ────────────────────────────────────────────────────────────
interface LogoUploaderProps {
  logoDataUrl: string;
  uploading: boolean;
  canEdit: boolean;
  onFileSelected: (file: File, previewDataUrl: string) => void;
  onLogoRemove: () => void;
}
function LogoUploader({ logoDataUrl, uploading, canEdit, onFileSelected, onLogoRemove }: LogoUploaderProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (file: File | undefined) => {
    if (!file || !canEdit) return;
    if (!['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onFileSelected(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="md:col-span-2 flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <div
        className={cn(
          'w-24 h-24 bg-white rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors',
          canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
          dragging && canEdit ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        )}
        onDragOver={(e) => { if (!canEdit) return; e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        onClick={() => canEdit && !uploading && ref.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
        ) : logoDataUrl ? (
          <img src={logoDataUrl} alt="Logo" className="w-full h-full object-contain p-1" />
        ) : (
          <Upload className="w-6 h-6 text-gray-300" />
        )}
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
          disabled={!canEdit}
        />
      </div>
      <div className="space-y-2">
        {canEdit ? (
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 text-xs" type="button" disabled={uploading} onClick={() => ref.current?.click()}>
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Subiendo...' : 'Subir Logo'}
            </Button>
            {logoDataUrl && !uploading && (
              <Button variant="outline" className="h-9 text-xs" type="button" onClick={onLogoRemove}>
                <X className="w-3.5 h-3.5" /> Quitar
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Solo lectura</span>
          </div>
        )}
        <p className="text-[10px] text-gray-400">
          JPG, PNG, SVG o WEBP. Máximo 2MB.<br />
          Se mostrará en tus comprobantes electrónicos.
        </p>
      </div>
    </div>
  );
}

// ─── Sucursal Series Row ──────────────────────────────────────────────────────
function SucursalSerieRow({
  label, serie, correlativo,
  onSerieChange, onCorrelativoChange,
  prefix, hint, readOnly,
}: {
  label: string;
  serie: string;
  correlativo: number;
  onSerieChange: (val: string) => void;
  onCorrelativoChange: (val: number) => void;
  prefix: string;
  hint: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1 space-y-1.5">
        <FieldLabel>{label} — Serie</FieldLabel>
        <input
          className={cn(
            'w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm transition-colors',
            readOnly
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'focus:border-brand-blue bg-white'
          )}
          value={serie}
          onChange={(e) => !readOnly && onSerieChange(e.target.value)}
          placeholder={hint}
          maxLength={4}
          readOnly={readOnly}
        />
        <p className="text-[10px] text-gray-400 italic">Empieza con "{prefix}" — máx. 4 caracteres</p>
      </div>
      <div className="w-56 space-y-1.5">
        <FieldLabel>Correlativo inicial</FieldLabel>
        <input
          type="number"
          min={1}
          className={cn(
            'w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm transition-colors',
            readOnly
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'focus:border-brand-blue bg-white'
          )}
          value={correlativo}
          onChange={(e) =>
            !readOnly && onCorrelativoChange(Math.max(1, parseInt(e.target.value) || 1))
          }
          readOnly={readOnly}
        />
        <p className="text-[10px] text-gray-400 italic">Por defecto: 1</p>
      </div>
    </div>
  );
}

// ─── Sucursal Card ────────────────────────────────────────────────────────────
function SucursalCard({
  sucursal, onChange, onSave, saving, readOnly,
}: {
  sucursal: Sucursal;
  onChange: (updated: Sucursal) => void;
  onSave: (s: Sucursal) => void;
  saving: boolean;
  readOnly?: boolean;
}) {
  const upd = (field: keyof Sucursal) => (val: string | number) =>
    onChange({ ...sucursal, [field]: val });

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100">
            <Store className="w-4 h-4 text-brand-blue" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{sucursal.nombre}</p>
            <p className="text-xs text-gray-500">{sucursal.direccion}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
            Cod. {sucursal.codEstablecimiento}
          </span>
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide',
              sucursal.estado
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-rose-50 text-rose-500 border border-rose-100'
            )}
          >
            {sucursal.estado ? 'Activo' : 'Inactivo'}
          </span>
          {readOnly && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Solo lectura
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <SucursalSerieRow label="Factura" serie={sucursal.serieFactura} correlativo={sucursal.correlativoFactura}
          onSerieChange={(v) => upd('serieFactura')(v)} onCorrelativoChange={(v) => upd('correlativoFactura')(v)}
          prefix="F" hint="F001" readOnly={readOnly} />
        <SucursalSerieRow label="Boleta" serie={sucursal.serieBoleta} correlativo={sucursal.correlativoBoleta}
          onSerieChange={(v) => upd('serieBoleta')(v)} onCorrelativoChange={(v) => upd('correlativoBoleta')(v)}
          prefix="B" hint="B001" readOnly={readOnly} />
        <SucursalSerieRow label="Nota de Crédito" serie={sucursal.serieNotaCredito} correlativo={sucursal.correlativoNotaCredito}
          onSerieChange={(v) => upd('serieNotaCredito')(v)} onCorrelativoChange={(v) => upd('correlativoNotaCredito')(v)}
          prefix="F" hint="FC01" readOnly={readOnly} />
        <SucursalSerieRow label="Nota de Débito" serie={sucursal.serieNotaDebito} correlativo={sucursal.correlativoNotaDebito}
          onSerieChange={(v) => upd('serieNotaDebito')(v)} onCorrelativoChange={(v) => upd('correlativoNotaDebito')(v)}
          prefix="F" hint="FD01" readOnly={readOnly} />
        <SucursalSerieRow label="Guía de Remisión" serie={sucursal.serieGuiaRemision} correlativo={sucursal.correlativoGuiaRemision}
          onSerieChange={(v) => upd('serieGuiaRemision')(v)} onCorrelativoChange={(v) => upd('correlativoGuiaRemision')(v)}
          prefix="T" hint="T001" readOnly={readOnly} />
        <SucursalSerieRow label="Guía Transportista" serie={sucursal.serieGuiaTransportista} correlativo={sucursal.correlativoGuiaTransportista}
          onSerieChange={(v) => upd('serieGuiaTransportista')(v)} onCorrelativoChange={(v) => upd('correlativoGuiaTransportista')(v)}
          prefix="V" hint="V001" readOnly={readOnly} />
      </div>

      {/* Footer — solo visible si puede editar */}
      {!readOnly && (
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button
            type="button"
            className="h-9 text-xs"
            disabled={saving}
            onClick={() => onSave(sucursal)}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hash className="w-3.5 h-3.5" />}
            {saving ? 'Guardando...' : 'Guardar Series'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [savingSucursalId, setSavingSucursalId] = useState<number | null>(null);

  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [logoBase64Pure, setLogoBase64Pure] = useState<string | null>(null);

  const { accessToken, user, refreshLogo } = useAuth();

  // ── Permisos por rol ───────────────────────────────────────────────────────
  const isSuperAdmin = user?.username === 'superAdminOpen';
  const canEdit      = user?.rol === 'admin' || isSuperAdmin;
  const isFacturador = user?.rol === 'facturador';

  const [form, setForm] = useState<EmpresaForm>({
    ruc: '', razonSocial: '', nombreComercial: '',
    departamento: '', provincia: '', distrito: '',
    direccion: '', ubigeo: '', telefono: '', email: '',
  });

  // ── GET empresa ───────────────────────────────────────────────────────────
  useEffect(() => {
    const ruc = user?.ruc;
    if (!ruc) return;

    setLoadingEmpresa(true);
    axios
      .get(`${BASE_URL}/api/companies/${ruc}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        const d = res.data;
        setForm({
          ruc:             d.ruc             ?? '',
          razonSocial:     d.razonSocial     ?? '',
          nombreComercial: d.nombreComercial ?? '',
          departamento:    (d.departamento   ?? '').toUpperCase(),
          provincia:       d.provincia       ?? '',
          distrito:        d.distrito        ?? '',
          direccion:       d.direccion       ?? '',
          ubigeo:          d.ubigeo          ?? '',
          telefono:        d.telefono        ?? '',
          email:           d.email           ?? '',
        });
        if (d.logoBase64) {
          setLogoBase64Pure(d.logoBase64);
          setLogoDataUrl(toDataUrl(d.logoBase64));
        }
      })
      .catch(() => showToast('No se pudo cargar los datos de la empresa', 'error'))
      .finally(() => setLoadingEmpresa(false));
  }, [user?.ruc]);

  // ── GET sucursales ────────────────────────────────────────────────────────
  useEffect(() => {
    const ruc = user?.ruc;
    if (!ruc) return;

    setLoadingSucursales(true);

    if (isSuperAdmin) {
      axios
        .get(`${BASE_URL}/api/Sucursal?ruc=${ruc}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => setSucursales(res.data ?? []))
        .catch(() => showToast('No se pudieron cargar las sucursales', 'error'))
        .finally(() => setLoadingSucursales(false));
    } else {
      const sucursalId = user?.sucursalID;
      if (!sucursalId) { setLoadingSucursales(false); return; }
      axios
        .get(`${BASE_URL}/api/Sucursal/${sucursalId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => setSucursales([res.data]))
        .catch(() => showToast('No se pudo cargar la sucursal', 'error'))
        .finally(() => setLoadingSucursales(false));
    }
  }, [user?.ruc, user?.sucursalID, isSuperAdmin]);

  // ── Subir logo ────────────────────────────────────────────────────────────
  const handleFileSelected = async (file: File, previewDataUrl: string) => {
    if (!canEdit) return;
    setLogoDataUrl(previewDataUrl);
    setLogoBase64Pure(stripDataUrlPrefix(previewDataUrl));
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('File', file);
      await axios.post(`${BASE_URL}/api/companies/file/base64`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${accessToken}` },
      });
      showToast('Logo subido correctamente', 'success');
    } catch {
      setLogoDataUrl('');
      setLogoBase64Pure(null);
      showToast('Error al subir el logo. Inténtalo de nuevo.', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = () => {
    if (!canEdit) return;
    setLogoDataUrl('');
    setLogoBase64Pure(null);
  };

  const upd =
    (key: keyof EmpresaForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!canEdit) return;
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  // ── PUT empresa ───────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!form.ruc || !form.razonSocial || !form.direccion || !form.email) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        razonSocial:     form.razonSocial,
        nombreComercial: form.nombreComercial || null,
        direccion:       form.direccion,
        ubigeo:          form.ubigeo          || null,
        provincia:       form.provincia,
        departamento:    form.departamento,
        distrito:        form.distrito,
        telefono:        form.telefono        || null,
        email:           form.email,
        logoBase64:      logoBase64Pure,
      };
      await axios.put(`${BASE_URL}/api/companies/${form.ruc}`, payload, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      await refreshLogo();
      showToast('Datos de empresa actualizados correctamente', 'success');
    } catch {
      showToast('Error al guardar los datos. Verifica tu conexión.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── PUT sucursal ──────────────────────────────────────────────────────────
  const handleSaveSucursal = async (sucursal: Sucursal) => {
    if (!canEdit) return;
    setSavingSucursalId(sucursal.sucursalId);
    try {
      const payload = {
        sucursalId:                   sucursal.sucursalId,
        nombre:                       sucursal.nombre,
        direccion:                    sucursal.direccion,
        serieFactura:                 sucursal.serieFactura,
        correlativoFactura:           sucursal.correlativoFactura,
        serieBoleta:                  sucursal.serieBoleta,
        correlativoBoleta:            sucursal.correlativoBoleta,
        serieNotaCredito:             sucursal.serieNotaCredito,
        correlativoNotaCredito:       sucursal.correlativoNotaCredito,
        serieNotaDebito:              sucursal.serieNotaDebito,
        correlativoNotaDebito:        sucursal.correlativoNotaDebito,
        serieGuiaRemision:            sucursal.serieGuiaRemision,
        correlativoGuiaRemision:      sucursal.correlativoGuiaRemision,
        serieGuiaTransportista:       sucursal.serieGuiaTransportista,
        correlativoGuiaTransportista: sucursal.correlativoGuiaTransportista,
      };
      await axios.put(`${BASE_URL}/api/Sucursal/${sucursal.sucursalId}`, payload, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      showToast(`Series de "${sucursal.nombre}" guardadas correctamente`, 'success');
    } catch {
      showToast(`Error al guardar la sucursal "${sucursal.nombre}"`, 'error');
    } finally {
      setSavingSucursalId(null);
    }
  };

  const handleSucursalChange = (updated: Sucursal) => {
    if (!canEdit) return;
    setSucursales((prev) =>
      prev.map((s) => (s.sucursalId === updated.sucursalId ? updated : s))
    );
  };

  return (
    <form onSubmit={handleSave} className="mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Datos de la Empresa ── */}
      <Card title="Datos de la Empresa" subtitle="Información que aparecerá en tus comprobantes electrónicos">
        {loadingEmpresa ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando datos de la empresa...</span>
          </div>
        ) : (
          <>
            {isFacturador && <ReadOnlyBanner />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LogoUploader
                logoDataUrl={logoDataUrl}
                uploading={uploadingLogo}
                canEdit={canEdit}
                onFileSelected={handleFileSelected}
                onLogoRemove={handleLogoRemove}
              />

              <div className="md:col-span-2">
                <SectionHeader icon={Building2} title="Identificación Tributaria" subtitle="Datos registrados en SUNAT" />
              </div>

              <Input label="RUC" value={form.ruc} disabled hint="El RUC no puede modificarse" />
              <Input label="Razón Social" value={form.razonSocial} onChange={upd('razonSocial')}
                required placeholder="Nombre legal de la empresa" disabled={!canEdit} />
              <Input label="Nombre Comercial" value={form.nombreComercial} onChange={upd('nombreComercial')}
                placeholder="Nombre con el que opera (opcional)" disabled={!canEdit} />

              <div className="md:col-span-2">
                <SectionHeader icon={MapPin} title="Ubicación y Domicilio Fiscal" subtitle="Dirección registrada en SUNAT para tus comprobantes" />
              </div>

              <Select label="Departamento" required value={form.departamento} onChange={upd('departamento')}
                options={DEPARTAMENTOS.map((d) => ({ value: d, label: d }))} disabled={!canEdit} />
              <Input label="Provincia" value={form.provincia} onChange={upd('provincia')}
                required placeholder="Ej: Cajamarca" disabled={!canEdit} />
              <Input label="Distrito" value={form.distrito} onChange={upd('distrito')}
                required placeholder="Ej: Cajamarca" disabled={!canEdit} />
              <Input label="Ubigeo" value={form.ubigeo} onChange={upd('ubigeo')}
                placeholder="Ej: 060101" maxLength={6} disabled={!canEdit}
                hint="Código de ubicación geográfica INEI (6 dígitos)" />

              <div className="md:col-span-2">
                <Input label="Dirección Fiscal" value={form.direccion} onChange={upd('direccion')}
                  required placeholder="Av. / Jr. / Calle + número, referencia" disabled={!canEdit}
                  hint="Dirección completa tal como aparece en SUNAT" />
              </div>

              <div className="md:col-span-2">
                <SectionHeader icon={Phone} title="Datos de Contacto" subtitle="Información de comunicación de la empresa" />
              </div>

              <Input label="Teléfono" value={form.telefono} onChange={upd('telefono')}
                placeholder="Ej: 01 234 5678 / 999 123 456" type="tel" disabled={!canEdit} />
              <Input label="Email" value={form.email} onChange={upd('email')}
                required placeholder="contacto@empresa.pe" type="email" disabled={!canEdit}
                hint="Se usará para notificaciones y envío de comprobantes" />
            </div>
          </>
        )}

        {/* Botón guardar — oculto para facturador */}
        {canEdit && (
          <div className="mt-8 flex justify-end">
            <Button type="submit" disabled={saving || loadingEmpresa || uploadingLogo}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando...' : 'Guardar Datos de Empresa'}
            </Button>
          </div>
        )}
      </Card>

      {/* ── Series de Comprobantes ── */}
      <Card
        title="Series de Comprobantes"
        subtitle={
          canEdit
            ? isSuperAdmin
              ? 'Configura las series y correlativos de cada sucursal'
              : 'Configura las series y correlativos de tu sucursal'
            : 'Consulta las series y correlativos de tu sucursal'
        }
      >
        {loadingSucursales ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando sucursales...</span>
          </div>
        ) : sucursales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Store className="w-8 h-8 text-gray-300" />
            <p className="text-sm">No se encontraron sucursales</p>
          </div>
        ) : (
          <>
            {isFacturador && <ReadOnlyBanner />}
            <div className="space-y-5">
              {sucursales.map((sucursal) => (
                <SucursalCard
                  key={sucursal.sucursalId}
                  sucursal={sucursal}
                  onChange={handleSucursalChange}
                  onSave={handleSaveSucursal}
                  saving={savingSucursalId === sucursal.sucursalId}
                  readOnly={!canEdit}
                />
              ))}
            </div>
          </>
        )}
      </Card>

    </form>
  );
}